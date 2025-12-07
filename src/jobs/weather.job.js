import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";

const lastAlertsCache = new Map();
const ALERT_CACHE_TTL = 60 * 60 * 1000;

function setAlertCache(cacheKey) {
  lastAlertsCache.set(cacheKey, Date.now());
}

function getAlertCache(cacheKey) {
  const timestamp = lastAlertsCache.get(cacheKey);
  if (!timestamp) return null;
  if (Date.now() - timestamp > ALERT_CACHE_TTL) {
    lastAlertsCache.delete(cacheKey);
    return null;
  }
  return cacheKey;
}

export function checkThresholds(obs, threshold) {
  const alerts = [];

  if (
    threshold.temperature != null &&
    obs.temperature != null &&
    obs.temperature < threshold.temperature
  ) {
    alerts.push(
      `Temperature will fall below on ${obs.date_and_time}: threshold = ${threshold.temperature}°F, observed = ${obs.temperature}°F`
    );
  }

  if (
    obs.relativeHumidity != null &&
    threshold.relativeHumidityMin != null &&
    threshold.relativeHumidityMax != null
  ) {
    if (
      obs.relativeHumidity >= threshold.relativeHumidityMin &&
      obs.relativeHumidity <= threshold.relativeHumidityMax
    ) {
      alerts.push(
        `Relative humidity will be between ${threshold.relativeHumidityMin}–${threshold.relativeHumidityMax}% on ${obs.date_and_time}`
      );
    }
  }

  if (
    obs.dispersionIndex != null &&
    threshold.dispersionIndexMin != null &&
    threshold.dispersionIndexMax != null
  ) {
    if (
      obs.dispersionIndex >= threshold.dispersionIndexMin &&
      obs.dispersionIndex <= threshold.dispersionIndexMax
    ) {
      alerts.push(
        `Dispersion index will be between ${threshold.dispersionIndexMin}–${threshold.dispersionIndexMax} on ${obs.date_and_time}`
      );
    }
  }

  if (obs.windDirection != null && obs.windSpeed != null) {
    let direction = null;

    if (typeof obs.windDirection === "string") {
      direction = obs.windDirection;
    } else if (typeof obs.windDirection === "number") {
      const degree = obs.windDirection;
      if (degree >= 337.5 || degree < 22.5) direction = "N";
      else if (degree < 67.5) direction = "NE";
      else if (degree < 112.5) direction = "E";
      else if (degree < 157.5) direction = "SE";
      else if (degree < 202.5) direction = "S";
      else if (degree < 247.5) direction = "SW";
      else if (degree < 292.5) direction = "W";
      else direction = "NW";
    }

    if (direction) {
      const windSpeedMap = {
        N: { min: threshold.northDirMin, max: threshold.northDirMax },
        NE: { min: threshold.northEastDirMin, max: threshold.northEastDirMax },
        E: { min: threshold.eastDirMin, max: threshold.eastDirMax },
        SE: { min: threshold.southEastDirMin, max: threshold.southEastDirMax },
        S: { min: threshold.southDirMin, max: threshold.southDirMax },
        SW: { min: threshold.southWestDirMin, max: threshold.southWestDirMax },
        W: { min: threshold.westDirMin, max: threshold.westDirMax },
        NW: { min: threshold.northWestDirMin, max: threshold.northWestDirMax },
      };

      const dirThreshold = windSpeedMap[direction];
      if (dirThreshold) {
        const { min, max } = dirThreshold;

        if (obs.windSpeed) {
          const match = obs.windSpeed.match(/(\d+)(?:\s*to\s*(\d+))?/);
          const windMin = match ? parseFloat(match[1]) : null;
          const windMax = match && match[2] ? parseFloat(match[2]) : windMin;

          if (
            windMin != null &&
            windMax != null &&
            min != null &&
            max != null
          ) {
            if (windMax >= min && windMin <= max) {
              alerts.push(
                `${direction} direction wind will be between ${min}–${max} mph on ${obs.date_and_time}`
              );
            }
          }
        }
      }
    }
  }

  return alerts;
}

cron.schedule("0 */3 * * *", async () => {
  // cron.schedule("*/59 * * * * *", async () => {
  console.log("[CRON] Running weather threshold check...");

  try {
    const batchSize = 20;
    let skip = 0;
    const triggeredAlerts = [];

    while (true) {
      const users = await prisma.user.findMany({
        include: { Threshold: true },
        skip,
        take: batchSize,
      });

      if (!users || users.length === 0) break;

      await Promise.all(
        users.map(async (user) => {
          if (!user.Threshold || !user.zoneId) return;

          try {
            const observations = await getZoneWeatherObservations(user.zoneId);
            if (!observations || !observations.length) {
              console.warn(`[CRON] No weather observations for ${user.email}`);
              return;
            }

            for (const obs of observations) {
              const alerts = checkThresholds(obs, user.Threshold);
              if (alerts.length > 0) {
                const cacheKey = `${user.zoneId}:${alerts.join("|")}`;
                const lastAlert = getAlertCache(cacheKey);

                if (lastAlert !== cacheKey) {
                  const alertMessage = alerts.join("; ");
                  const { password, Threshold, ...safeUser } = user;
                  triggeredAlerts.push({
                    user: safeUser,
                    alertMessage,
                  });
                  setAlertCache(cacheKey);

                  console.log(
                    `\n📢 ALERT TRIGGERED
            ├─ User Details:
            ${JSON.stringify(safeUser, null, 2)
              .split("\n")
              .map((line) => "  │  " + line)
              .join("\n")}
            ├─ Alerts:
            │  ${alertMessage.split("; ").join("\n  │  ")}
            └─ Time: ${new Date().toISOString()}\n`
                  );
                }
              }
            }
          } catch (err) {
            console.error(
              `[CRON] Weather fetch failed for ${user.email}:`,
              err?.message ?? err
            );
          }
        })
      );

      skip += batchSize;
    }

    if (triggeredAlerts.length > 0) {
      for (const alert of triggeredAlerts) {
        const messages = alert.alertMessage.split("; ").filter(Boolean);
        for (const msg of messages) {
          await sendNotification(alert.user, msg.trim());
        }
      }
    }
  } catch (err) {
    console.error("[CRON] Job failed:", err?.message ?? err);
  }
});
