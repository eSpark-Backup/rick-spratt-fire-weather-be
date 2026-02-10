import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";

function hasAnyWindThreshold(threshold) {
  return [
    threshold.northDirMin,
    threshold.northEastDirMin,
    threshold.eastDirMin,
    threshold.southEastDirMin,
    threshold.southDirMin,
    threshold.southWestDirMin,
    threshold.westDirMin,
    threshold.northWestDirMin,
  ].some((v) => v != null);
}

export function checkThresholds(observations, threshold) {
  const dailyAlerts = {};

  observations.forEach((obs) => {
    if (!obs.timestamp) return;

    // Split timestamp into start time and duration
    const [startTimeStr, durationStr] = obs.timestamp.split("/");
    const startDate = new Date(startTimeStr);

    // Parse duration properly (hours + minutes)
    let durationHours = 1;
    if (durationStr && durationStr.startsWith("PT")) {
      const hoursMatch = durationStr.match(/(\d+)H/);
      const minsMatch = durationStr.match(/(\d+)M/);
      durationHours = 0;
      if (hoursMatch) durationHours += parseInt(hoursMatch[1], 10);
      if (minsMatch)
        durationHours += Math.ceil(parseInt(minsMatch[1], 10) / 60);
      if (durationHours === 0) durationHours = 1; // fallback
    }

    // Loop through each hour in the forecast period
    for (let i = 0; i < durationHours; i++) {
      const obsDate = new Date(startDate.getTime() + i * 60 * 60 * 1000);
      const date = obsDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (!dailyAlerts[date]) {
        dailyAlerts[date] = {
          temperature: threshold.temperature != null ? false : null,
          humidity: threshold.relativeHumidity != null ? false : null,
          dispersion:
            threshold.dispersionIndexMin != null &&
            threshold.dispersionIndexMax != null
              ? false
              : null,
          windOK: hasAnyWindThreshold(threshold) ? false : null,
        };
      }

      const day = dailyAlerts[date];

      // Temperature: mark true if obs is below threshold
      if (
        threshold.temperature != null &&
        obs.temperature != null &&
        obs.temperature < threshold.temperature
      ) {
        day.temperature = true;
      }

      // Humidity: mark true if obs exceeds threshold
      if (
        obs.relativeHumidity != null &&
        threshold.relativeHumidity != null &&
        obs.relativeHumidity > threshold.relativeHumidity
      ) {
        day.humidity = true;
      }

      // Dispersion index: mark true if obs within threshold range
      if (
        obs.dispersionIndex != null &&
        threshold.dispersionIndexMin != null &&
        threshold.dispersionIndexMax != null &&
        obs.dispersionIndex >= threshold.dispersionIndexMin &&
        obs.dispersionIndex <= threshold.dispersionIndexMax
      ) {
        day.dispersion = true;
      }

      // Wind: mark true if any obs satisfies directional threshold
      if (obs.windDirection != null && obs.windSpeed != null) {
        let direction = obs.windDirection;

        if (typeof direction === "number") {
          const degree = direction;
          if (degree >= 337.5 || degree < 22.5) direction = "N";
          else if (degree < 67.5) direction = "NE";
          else if (degree < 112.5) direction = "E";
          else if (degree < 157.5) direction = "SE";
          else if (degree < 202.5) direction = "S";
          else if (degree < 247.5) direction = "SW";
          else if (degree < 292.5) direction = "W";
          else direction = "NW";
        }

        const windSpeedMap = {
          N: {
            min: threshold.northDirMin,
            max: threshold.northDirMax,
          },
          NE: {
            min: threshold.northEastDirMin,
            max: threshold.northEastDirMax,
          },
          E: {
            min: threshold.eastDirMin,
            max: threshold.eastDirMax,
          },
          SE: {
            min: threshold.southEastDirMin,
            max: threshold.southEastDirMax,
          },
          S: {
            min: threshold.southDirMin,
            max: threshold.southDirMax,
          },
          SW: {
            min: threshold.southWestDirMin,
            max: threshold.southWestDirMax,
          },
          W: {
            min: threshold.westDirMin,
            max: threshold.westDirMax,
          },
          NW: {
            min: threshold.northWestDirMin,
            max: threshold.northWestDirMax,
          },
        };

        const dirThreshold = windSpeedMap[direction];

        if (
          dirThreshold &&
          dirThreshold.min != null &&
          dirThreshold.max != null &&
          obs.windSpeed >= dirThreshold.min &&
          obs.windSpeed <= dirThreshold.max
        ) {
          day.windOK = true;
        }
      }
    }
  });

  // Aggregate alerts per day
  const alerts = [];

  Object.entries(dailyAlerts).forEach(([date, day]) => {
    // if (day.temperature && day.humidity && day.dispersion && day.windOK) {
    const allConditionsMet = Object.values(day)
      .filter((v) => v !== null) // ignore unset thresholds
      .every((v) => v === true);

    if (allConditionsMet) {
      alerts.push({
        type: "all_conditions",
        date,
        message: `All burn conditions are forecasted to be within thresholds on ${date}`,
      });
    }
  });

  return alerts;
}

cron.schedule("0 0 * * *", async () => {
  // cron.schedule("*/30 * * * * *", async () => {
  console.log("[CRON] Running weather threshold check...");
  const sentThisRun = new Set();

  try {
    const batchSize = 20;
    let skip = 0;

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

            // Get all daily grouped alerts
            const alerts = checkThresholds(observations, user.Threshold);

            for (const alert of alerts) {
              const runKey = `${user.id}:${alert.type}:${alert.date}`;

              // Skip if already sent in this cron run
              if (sentThisRun.has(runKey)) continue;
              sentThisRun.add(runKey);

              const { password, Threshold, ...safeUser } = user;
              await sendNotification(safeUser, alert.message);

              console.log(
                `\n📢 ALERT SENT
      ├─ User: ${user.email}
      ├─ Type: ${alert.type}
      ├─ Date: ${alert.date}
      ├─ Message: ${alert.message}
      └─ Time: ${new Date().toISOString()}\n`,
              );
            }
          } catch (err) {
            console.error(
              `[CRON] Weather fetch failed for ${user.email}:`,
              err?.message ?? err,
            );
          }
        }),
      );

      skip += batchSize;
    }
  } catch (err) {
    console.error("[CRON] Job failed:", err?.message ?? err);
  }
});
