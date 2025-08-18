import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";

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
    threshold.windMax !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed > threshold.windMax
  ) {
    alerts.push(`Wind speed exceeded ${threshold.windMax}%`);
  }

  if (
    threshold.windMin !== null &&
    obs.windSpeed !== null &&
    obs.windSpeed < threshold.windMin
  ) {
    alerts.push(`Wind speed exceeded ${threshold.windMin}%`);
  }

  return alerts;
}

// Run every 15 minutes
cron.schedule("* * * * *", async () => {
  console.log("[CRON] Running optimized weather threshold check...");

  try {
    const batchSize = 20;
    let skip = 0;

    while (true) {
      // 1. Get users in batches to avoid memory overload
      const users = await prisma.user.findMany({
        include: { Threshold: true },
        skip,
        take: batchSize,
      });

      if (users.length === 0) break;

      // 2. Process all users in parallel
      await Promise.all(
        users.map(async (user) => {
          if (!user.Threshold || !user.zoneId) return;

          try {
            // 3. Fetch weather for the user’s zoneId
            const observations = await getZoneWeatherObservations(user.zoneId);

            // 4. Check only the latest observation
            const latestObs = observations[0];
            if (!latestObs) return;

            const alerts = checkThresholds(latestObs, user.Threshold);

            if (alerts.length > 0) {
              const cacheKey = `${user.id}:${alerts.join("|")}`;
              const lastAlert = lastAlertsCache.get(user.id);

              // Avoid sending duplicate alerts
              if (lastAlert !== cacheKey) {
                 await sendNotification(user, alerts.join("; "));
                lastAlertsCache.set(user.id, cacheKey);
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
