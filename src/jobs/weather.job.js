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

  if (obs.windDirection !== null && obs.windSpeed !== null) {
    const degree = obs.windDirection;
    let direction;

    // full 8-point compass
    if (degree >= 337.5 || degree < 22.5) direction = "N";
    else if (degree >= 22.5 && degree < 67.5) direction = "NE";
    else if (degree >= 67.5 && degree < 112.5) direction = "E";
    else if (degree >= 112.5 && degree < 157.5) direction = "SE";
    else if (degree >= 157.5 && degree < 202.5) direction = "S";
    else if (degree >= 202.5 && degree < 247.5) direction = "SW";
    else if (degree >= 247.5 && degree < 292.5) direction = "W";
    else if (degree >= 292.5 && degree < 337.5) direction = "NW";

    switch (direction) {
      case "N":
        if (
          threshold.northDirMin !== null &&
          obs.windSpeed < threshold.northDirMin
        ) {
          alerts.push(`North wind below minimum ${threshold.northDirMin} mph`);
        }
        if (
          threshold.northDirMax !== null &&
          obs.windSpeed > threshold.northDirMax
        ) {
          alerts.push(
            `North wind exceeded maximum ${threshold.northDirMax} mph`
          );
        }
        break;

      case "NE":
        if (
          threshold.northEastDirMin !== null &&
          obs.windSpeed < threshold.northEastDirMin
        ) {
          alerts.push(`NE wind below minimum ${threshold.northEastDirMin} mph`);
        }
        if (
          threshold.northEastDirMax !== null &&
          obs.windSpeed > threshold.northEastDirMax
        ) {
          alerts.push(
            `NE wind exceeded maximum ${threshold.northEastDirMax} mph`
          );
        }
        break;

      case "E":
        if (
          threshold.eastDirMin !== null &&
          obs.windSpeed < threshold.eastDirMin
        ) {
          alerts.push(`East wind below minimum ${threshold.eastDirMin} mph`);
        }
        if (
          threshold.eastDirMax !== null &&
          obs.windSpeed > threshold.eastDirMax
        ) {
          alerts.push(`East wind exceeded maximum ${threshold.eastDirMax} mph`);
        }
        break;

      case "SE":
        if (
          threshold.southEastDirMin !== null &&
          obs.windSpeed < threshold.southEastDirMin
        ) {
          alerts.push(`SE wind below minimum ${threshold.southEastDirMin} mph`);
        }
        if (
          threshold.southEastDirMax !== null &&
          obs.windSpeed > threshold.southEastDirMax
        ) {
          alerts.push(
            `SE wind exceeded maximum ${threshold.southEastDirMax} mph`
          );
        }
        break;

      case "S":
        if (
          threshold.southDirMin !== null &&
          obs.windSpeed < threshold.southDirMin
        ) {
          alerts.push(`South wind below minimum ${threshold.southDirMin} mph`);
        }
        if (
          threshold.southDirMax !== null &&
          obs.windSpeed > threshold.southDirMax
        ) {
          alerts.push(
            `South wind exceeded maximum ${threshold.southDirMax} mph`
          );
        }
        break;

      case "SW":
        if (
          threshold.southWestDirMin !== null &&
          obs.windSpeed < threshold.southWestDirMin
        ) {
          alerts.push(`SW wind below minimum ${threshold.southWestDirMin} mph`);
        }
        if (
          threshold.southWestDirMax !== null &&
          obs.windSpeed > threshold.southWestDirMax
        ) {
          alerts.push(
            `SW wind exceeded maximum ${threshold.southWestDirMax} mph`
          );
        }
        break;

      case "W":
        if (
          threshold.westDirMin !== null &&
          obs.windSpeed < threshold.westDirMin
        ) {
          alerts.push(`West wind below minimum ${threshold.westDirMin} mph`);
        }
        if (
          threshold.westDirMax !== null &&
          obs.windSpeed > threshold.westDirMax
        ) {
          alerts.push(`West wind exceeded maximum ${threshold.westDirMax} mph`);
        }
        break;

      case "NW":
        if (
          threshold.northWestDirMin !== null &&
          obs.windSpeed < threshold.northWestDirMin
        ) {
          alerts.push(`NW wind below minimum ${threshold.northWestDirMin} mph`);
        }
        if (
          threshold.northWestDirMax !== null &&
          obs.windSpeed > threshold.northWestDirMax
        ) {
          alerts.push(
            `NW wind exceeded maximum ${threshold.northWestDirMax} mph`
          );
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
