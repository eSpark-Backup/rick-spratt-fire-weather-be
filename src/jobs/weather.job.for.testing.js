// src/jobs/weather.job.js
import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";

const lastAlertsCache = new Map();

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
      threshold.windMin !== null &&
      obs.windSpeed !== null &&
      obs.windSpeed < threshold.windMin
    ) {
      alerts.push(`Wind speed dropped below ${threshold.windMin} m/s`);
    }

  if (
    threshold.windMax !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed > threshold.windMax
  ) {
    alerts.push(`Wind speed exceeded ${threshold.windMax} m/s`);
  }
  

  return alerts;
}

// Run every minute for testing
cron.schedule("*/5 * * * * *", async () => {
  console.log(
    "[CRON] Running weather threshold check at",
    new Date().toISOString()
  );

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
            if (!latestObs) return;

            const alerts = checkThresholds(latestObs, user.Threshold);

            if (alerts.length > 0) {
              const cacheKey = `${user.id}:${alerts.join("|")}`;
              const lastAlert = lastAlertsCache.get(user.id);

              if (lastAlert !== cacheKey) {
                lastAlertsCache.set(user.id, cacheKey);
                console.log(
                  `[ALERT] User: ${user.email} → ${alerts.join("; ")}`
                );
              }
            } else {
              console.log(`[INFO] User: ${user.email} → No threshold exceeded`);
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
