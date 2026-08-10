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
  // --- ALIGN WIND SPEED AND DIRECTION INTO HOURLY OBSERVATIONS ---
  function expandHourly(series) {
    const result = [];
    for (const obs of series.values) {
      const [startStr, durStr] = obs.validTime.split("/");
      const start = new Date(startStr);
      let hours = 1;
      if (durStr.startsWith("PT")) {
        const h = durStr.match(/(\d+)H/);
        const m = durStr.match(/(\d+)M/);
        hours = 0;
        if (h) hours += parseInt(h[1], 10);
        if (m) hours += Math.ceil(parseInt(m[1], 10) / 60);
        if (hours === 0) hours = 1;
      }
      for (let i = 0; i < hours; i++) {
        result.push({
          timestamp: new Date(start.getTime() + i * 3600000).toISOString(),
          value: obs.value,
        });
      }
    }
    return result;
  }

  // Assuming observations has windSpeedSeries and windDirectionSeries
  if (observations.windSpeedSeries && observations.windDirectionSeries) {
    const windSpeedHourly = expandHourly(observations.windSpeedSeries);
    const windDirHourly = expandHourly(observations.windDirectionSeries);

    const hourlyObsMap = {};

    // Map wind direction per hour
    for (const obs of windDirHourly) {
      hourlyObsMap[obs.timestamp] = hourlyObsMap[obs.timestamp] || {};
      hourlyObsMap[obs.timestamp].windDirection = obs.value;
    }

    // Convert numeric wind direction to compass (N, NE, E, etc.)
    for (const key in hourlyObsMap) {
      const dir = hourlyObsMap[key].windDirection;
      if (typeof dir === "number") {
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        hourlyObsMap[key].windDirection = dirs[Math.round(dir / 45) % 8];
      }
    }

    // Map wind speed per hour
    for (const obs of windSpeedHourly) {
      hourlyObsMap[obs.timestamp] = hourlyObsMap[obs.timestamp] || {};
      hourlyObsMap[obs.timestamp].windSpeed = obs.value;
    }

    // Replace observations array with merged, only keep hours with both windDirection and windSpeed
    observations = Object.values(hourlyObsMap).filter(
      (o) => o.windDirection != null && o.windSpeed != null,
    );
  }

  const dailyData = {};

  for (const obs of observations) {
    if (!obs.timestamp) continue;

    const [startTimeStr, durationStr] = obs.timestamp.split("/");
    const startDate = new Date(startTimeStr);

    // parse duration
    let durationHours = 1;
    if (durationStr && durationStr.startsWith("PT")) {
      const hours = durationStr.match(/(\d+)H/);
      const mins = durationStr.match(/(\d+)M/);

      durationHours = 0;
      if (hours) durationHours += parseInt(hours[1], 10);
      if (mins) durationHours += Math.ceil(parseInt(mins[1], 10) / 60);
      if (durationHours === 0) durationHours = 1;
    }

    for (let i = 0; i < durationHours; i++) {
      const obsDate = new Date(startDate.getTime() + i * 3600000);

      const dateKey = obsDate.toISOString().split("T")[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          temperature: threshold.temperature != null ? false : null,
          humidity: threshold.relativeHumidity != null ? false : null,
          dispersion:
            threshold.dispersionIndexMin != null &&
            threshold.dispersionIndexMax != null
              ? false
              : null,
          windOK: hasAnyWindThreshold(threshold) ? false : null,

          maxDispersion: -Infinity,

          // DAILY MAX wind speed per direction
          maxWind: {
            N: -Infinity,
            NE: -Infinity,
            E: -Infinity,
            SE: -Infinity,
            S: -Infinity,
            SW: -Infinity,
            W: -Infinity,
            NW: -Infinity,
          },
        };
      }

      const day = dailyData[dateKey];

      // Temperature
      if (
        threshold.temperature != null &&
        obs.temperature != null &&
        obs.temperature < threshold.temperature
      ) {
        day.temperature = true;
      }

      // Humidity
      if (
        threshold.relativeHumidity != null &&
        obs.relativeHumidity != null &&
        obs.relativeHumidity > threshold.relativeHumidity
      ) {
        day.humidity = true;
      }

      // Track DAILY MAX dispersion
      if (obs.dispersionIndex != null) {
        day.maxDispersion = Math.max(day.maxDispersion, obs.dispersionIndex);
      }

      if (obs.windDirection && obs.windSpeed != null) {
        const dir = obs.windDirection;

        // Only track directions that actually have a threshold set
        const minKey = {
          N: "northDirMin",
          NE: "northEastDirMin",
          E: "eastDirMin",
          SE: "southEastDirMin",
          S: "southDirMin",
          SW: "southWestDirMin",
          W: "westDirMin",
          NW: "northWestDirMin",
        }[dir];

        const maxKey = {
          N: "northDirMax",
          NE: "northEastDirMax",
          E: "eastDirMax",
          SE: "southEastDirMax",
          S: "southDirMax",
          SW: "southWestDirMax",
          W: "westDirMax",
          NW: "northWestDirMax",
        }[dir];

        if (
          minKey &&
          maxKey &&
          threshold[minKey] != null &&
          threshold[maxKey] != null
        ) {
          day.maxWind[dir] = Math.max(day.maxWind[dir], obs.windSpeed);
        }
      }
    }
  }

  const alerts = [];

  for (const [date, day] of Object.entries(dailyData)) {
    // ---------- DISPERSION CHECK ----------
    if (day.dispersion !== null) {
      if (
        day.maxDispersion !== -Infinity &&
        day.maxDispersion >= threshold.dispersionIndexMin &&
        day.maxDispersion <= threshold.dispersionIndexMax
      ) {
        day.dispersion = true;
      } else {
        day.dispersion = false;
      }
    }

    if (day.windOK !== null) {
      const windThresholdMap = {
        N: ["northDirMin", "northDirMax"],
        NE: ["northEastDirMin", "northEastDirMax"],
        E: ["eastDirMin", "eastDirMax"],
        SE: ["southEastDirMin", "southEastDirMax"],
        S: ["southDirMin", "southDirMax"],
        SW: ["southWestDirMin", "southWestDirMax"],
        W: ["westDirMin", "westDirMax"],
        NW: ["northWestDirMin", "northWestDirMax"],
      };

      let allWithinThreshold = true;

      for (const dir in windThresholdMap) {
        const [minKey, maxKey] = windThresholdMap[dir];

        const minVal = threshold[minKey];
        const maxVal = threshold[maxKey];

        if (minVal == null || maxVal == null) continue;

        const maxWind = day.maxWind?.[dir];

        // Only consider directions that actually occurred
        if (maxWind === -Infinity) {
          allWithinThreshold = false; // Direction threshold exists but no data
          break;
        }
        if (maxWind < minVal || maxWind > maxVal) {
          allWithinThreshold = false;
          break;
        }
      }

      day.windOK = allWithinThreshold;
    }

    // ---------- FINAL CONDITION ----------
    const checks = ["temperature", "humidity", "dispersion", "windOK"];

    const allConditionsMet = checks
      .map((k) => day[k])
      .filter((v) => v !== null)
      .every((v) => v === true);

    if (allConditionsMet) {
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      alerts.push({
        type: "all_conditions",
        date: formattedDate,
        message: `All burn conditions are forecasted to be within thresholds on ${formattedDate}`,
      });
    }
  }

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
