import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotificationToAllLoggedInUsers } from "../services/notification.service.js";

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

function checkThresholds(obs, threshold) {
  const alerts = [];

  if (
    threshold.temperature !== null &&
    obs.temperature !== null &&
    obs.temperature > threshold.temperature
  ) {
    alerts.push(`Temperature exceeded ${threshold.temperature}°C`);
  }

  if (
    threshold.humidity !== null &&
    obs.relativeHumidity !== null &&
    obs.relativeHumidity < threshold.humidity
  ) {
    alerts.push(`Humidity below minimum ${threshold.humidity}%`);
  }

  if (
    threshold.windSpeed !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed > threshold.windSpeed
  ) {
    alerts.push(`Wind speed exceeded ${threshold.windSpeed} mph`);
  }

  if (obs.windSpeedMph !== null) {
    if (obs.windSpeedMph < 5 || obs.windSpeedMph > 15) {
      alerts.push(
        `Wind speed out of safe range (5-15 mph): ${obs.windSpeedMph} mph`
      );
    }
  }

  if (obs.windDirection !== null && obs.windSpeed !== null) {
    const degree = obs.windDirection;
    let direction;

    if (degree >= 45 && degree < 135) {
      direction = "E";
    } else if (degree >= 135 && degree < 225) {
      direction = "S";
    } else if (degree >= 225 && degree < 315) {
      direction = "W";
    } else {
      direction = "N";
    }

    switch (direction) {
      case "N":
        if (threshold.northDir !== null && obs.windSpeed > threshold.northDir) {
          alerts.push(`North wind exceeded ${threshold.northDir} mph`);
        }
        break;
      case "S":
        if (threshold.southDir !== null && obs.windSpeed > threshold.southDir) {
          alerts.push(`South wind exceeded ${threshold.southDir} mph`);
        }
        break;
      case "E":
        if (threshold.eastDir !== null && obs.windSpeed > threshold.eastDir) {
          alerts.push(`East wind exceeded ${threshold.eastDir} mph`);
        }
        break;
      case "W":
        if (threshold.westDir !== null && obs.windSpeed > threshold.westDir) {
          alerts.push(`West wind exceeded ${threshold.westDir} mph`);
        }
        break;
    }
  }

  return alerts;
}

cron.schedule("0 */3 * * *", async () => {
  console.log("[CRON] Running optimized weather threshold check...");

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

      if (users.length === 0) break;

      await Promise.all(
        users.map(async (user) => {
          if (!user.Threshold || !user.zoneId) return;

          try {
            const observations = await getZoneWeatherObservations(user.zoneId);

            const latestObs = observations[0];
            if (!latestObs) {
              console.warn(`[CRON] No weather observation for ${user.email}`);
              return;
            }

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
              err.message
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
    console.error("[CRON] Job failed:", err.message);
  }
});
