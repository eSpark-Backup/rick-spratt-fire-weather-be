import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotificationToAllLoggedInUsers } from "../services/notification.service.js";

const lastAlertsCache = new Map();
const ALERT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

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

function checkThresholds(obs, threshold) {
  const alerts = [];

  // 1) Temperature (°F)
  if (
    threshold.temperature != null &&
    obs.temperature != null &&
    obs.temperature > threshold.temperature
  ) {
    alerts.push(
      `Temperature exceeded: threshold = ${threshold.temperature}°F, observed = ${obs.temperature}°F`
    );
  }

  // 2) Humidity (%)
  if (
    threshold.humidity != null &&
    obs.relativeHumidity != null &&
    obs.relativeHumidity < threshold.humidity
  ) {
    alerts.push(`Humidity below ${threshold.humidity}%`);
  }

  // 3) Dispersion Index (use user-defined thresholds)
  if (
    obs.dispersionIndex != null &&
    threshold.dispersionIndexMin != null &&
    threshold.dispersionIndexMax != null
  ) {
    if (obs.dispersionIndex < threshold.dispersionIndexMin) {
      alerts.push(
        `Dispersion Index (${obs.dispersionIndex}) is below minimum threshold (${threshold.dispersionIndexMin})`
      );
    } else if (obs.dispersionIndex > threshold.dispersionIndexMax) {
      alerts.push(
        `Dispersion Index (${obs.dispersionIndex}) exceeds maximum threshold (${threshold.dispersionIndexMax})`
      );
    }
  }

  // 4) Wind Direction / Speed (mph)
  if (obs.windDirection != null && obs.windSpeed != null) {
    let direction = null;

    // If the service provided a compass string already, use it
    if (typeof obs.windDirection === "string") {
      direction = obs.windDirection;
    } else if (typeof obs.windDirection === "number") {
      // convert degrees to 8-point compass
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
        // Trigger alert only when speed is between min and max (inclusive)
        if (
          min != null &&
          max != null &&
          obs.windSpeed >= min &&
          obs.windSpeed <= max
        ) {
          alerts.push(`${direction} wind is between ${min}–${max} mph`);
        }
      }
    }
  }

  return alerts;
}

cron.schedule("*/5 * * * *", async () => {
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
          // user.Threshold is a 1:1 relation (object) per your schema
          if (!user.Threshold || !user.zoneId) return;

          try {
            // The service returns normalized observations (not raw features)
            const observations = await getZoneWeatherObservations(user.zoneId);
            const latestObs =
              observations && observations.length ? observations[0] : null;

            if (!latestObs) {
              console.warn(`[CRON] No weather observation for ${user.email}`);
              return;
            }

            // Directly pass normalized obs to checker
            const alerts = checkThresholds(latestObs, user.Threshold);

            if (alerts.length > 0) {
              const cacheKey = `${user.zoneId}:${alerts.join("|")}`;
              const lastAlert = getAlertCache(cacheKey);

              if (lastAlert !== cacheKey) {
                triggeredAlerts.push(alerts.join("; "));
                setAlertCache(cacheKey);
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
      const uniqueMessage = [...new Set(triggeredAlerts)].join(" | ");
      await sendNotificationToAllLoggedInUsers(uniqueMessage);
      console.log(`[ALERT] Broadcasted: ${uniqueMessage}`);
    }
  } catch (err) {
    console.error("[CRON] Job failed:", err?.message ?? err);
  }
});
