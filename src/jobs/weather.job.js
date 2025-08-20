import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";

const lastAlertsCache = new Map();
const ALERT_CACHE_TTL = 60 * 60 * 1000;

function setAlertCache(userId, cacheKey) {
  lastAlertsCache.set(userId, { key: cacheKey, timestamp: Date.now() });
}

function getAlertCache(userId) {
  const entry = lastAlertsCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ALERT_CACHE_TTL) {
    lastAlertsCache.delete(userId);
    return null;
  }
  return entry.key;
}

function checkThresholds(obs, threshold) {
  const alerts = [];

  if (
    threshold.tempMin !== null &&
    obs.temperature !== null &&
    obs.temperature < threshold.tempMin
  ) {
    alerts.push(`Temperature dropped below ${threshold.tempMin}°C`);
  }
  if (
    threshold.tempMax !== null &&
    obs.temperature !== null &&
    obs.temperature > threshold.tempMax
  ) {
    alerts.push(`Temperature exceeded ${threshold.tempMax}°C`);
  }

  if (
    threshold.rhMin !== null &&
    obs.relativeHumidity !== null &&
    obs.relativeHumidity < threshold.rhMin
  ) {
    alerts.push(`Humidity dropped below ${threshold.rhMin}%`);
  }
  if (
    threshold.rhMax !== null &&
    obs.relativeHumidity !== null &&
    obs.relativeHumidity > threshold.rhMax
  ) {
    alerts.push(`Humidity exceeded ${threshold.rhMax}%`);
  }

  if (
    threshold.windMax !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed > threshold.windMax
  ) {
    alerts.push(`Wind speed exceeded ${threshold.windMax} Km/h`);
  }

  if (
    threshold.windMin !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed < threshold.windMin
  ) {
    alerts.push(`Wind speed dropped below ${threshold.windMin} Km/h`);
  }

  return alerts;
}

cron.schedule("0 */3 * * *", async () => {
  console.log("[CRON] Running optimized weather threshold check...");

  try {
    const batchSize = 20;
    let skip = 0;

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
              console.warn(
                `[CRON] No weather observation for user ${user.email}`
              );
              return;
            }

            const alerts = checkThresholds(latestObs, user.Threshold);

            if (alerts.length > 0) {
              const cacheKey = `${user.id}:${alerts.join("|")}`;
              const lastAlert = getAlertCache(user.id);

              if (lastAlert !== cacheKey) {
                await sendNotification(user, alerts.join("; "));
                setAlertCache(user.id, cacheKey);
                console.log(
                  `[ALERT] Sent to ${user.email}: ${alerts.join("; ")}`
                );
              }
            }
          } catch (err) {
            console.error(
              `[CRON] Weather fetch failed for user ${user.email}:`,
              err.message
            );
          }
        })
      );

      skip += batchSize;
    }
  } catch (err) {
    console.error("[CRON] Job failed:", err.message);
  }
});
