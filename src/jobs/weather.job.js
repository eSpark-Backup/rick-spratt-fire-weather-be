// import cron from "node-cron";
// import { prisma } from "../prisma.js";
// import { getZoneWeatherObservations } from "../services/weather.service.js";
// import { sendNotification } from "../services/notification.service.js";

// const lastAlertsCache = new Map();
// const ALERT_CACHE_TTL = 60 * 60 * 1000;

// function setAlertCache(cacheKey) {
//   lastAlertsCache.set(cacheKey, Date.now());
// }

// function getAlertCache(cacheKey) {
//   const timestamp = lastAlertsCache.get(cacheKey);
//   if (!timestamp) return null;
//   if (Date.now() - timestamp > ALERT_CACHE_TTL) {
//     lastAlertsCache.delete(cacheKey);
//     return null;
//   }
//   return cacheKey;
// }

// export function checkThresholds(obs, threshold) {
//   const alerts = [];

//   if (
//     threshold.temperature != null &&
//     obs.temperature != null &&
//     obs.temperature < threshold.temperature
//   ) {
//     alerts.push(
//       `Temperature will fall below on ${obs.date_and_time}: threshold = ${threshold.temperature}°F, observed = ${obs.temperature}°F`
//     );
//   }

//   if (
//     obs.relativeHumidity != null &&
//     threshold.relativeHumidityMin != null &&
//     threshold.relativeHumidityMax != null
//   ) {
//     if (
//       obs.relativeHumidity >= threshold.relativeHumidityMin &&
//       obs.relativeHumidity <= threshold.relativeHumidityMax
//     ) {
//       alerts.push(
//         `Relative humidity will be between ${threshold.relativeHumidityMin}–${threshold.relativeHumidityMax}% on ${obs.date_and_time}`
//       );
//     }
//   }

//   if (
//     obs.dispersionIndex != null &&
//     threshold.dispersionIndexMin != null &&
//     threshold.dispersionIndexMax != null
//   ) {
//     if (
//       obs.dispersionIndex >= threshold.dispersionIndexMin &&
//       obs.dispersionIndex <= threshold.dispersionIndexMax
//     ) {
//       alerts.push(
//         `Dispersion index will be between ${threshold.dispersionIndexMin}–${threshold.dispersionIndexMax} on ${obs.date_and_time}`
//       );
//     }
//   }

//   if (obs.windDirection != null && obs.windSpeed != null) {
//     let direction = null;

//     if (typeof obs.windDirection === "string") {
//       direction = obs.windDirection;
//     } else if (typeof obs.windDirection === "number") {
//       const degree = obs.windDirection;
//       if (degree >= 337.5 || degree < 22.5) direction = "N";
//       else if (degree < 67.5) direction = "NE";
//       else if (degree < 112.5) direction = "E";
//       else if (degree < 157.5) direction = "SE";
//       else if (degree < 202.5) direction = "S";
//       else if (degree < 247.5) direction = "SW";
//       else if (degree < 292.5) direction = "W";
//       else direction = "NW";
//     }

//     if (direction) {
//       const windSpeedMap = {
//         N: { min: threshold.northDirMin, max: threshold.northDirMax },
//         NE: { min: threshold.northEastDirMin, max: threshold.northEastDirMax },
//         E: { min: threshold.eastDirMin, max: threshold.eastDirMax },
//         SE: { min: threshold.southEastDirMin, max: threshold.southEastDirMax },
//         S: { min: threshold.southDirMin, max: threshold.southDirMax },
//         SW: { min: threshold.southWestDirMin, max: threshold.southWestDirMax },
//         W: { min: threshold.westDirMin, max: threshold.westDirMax },
//         NW: { min: threshold.northWestDirMin, max: threshold.northWestDirMax },
//       };

//       const dirThreshold = windSpeedMap[direction];
//       if (dirThreshold) {
//         const { min, max } = dirThreshold;

//         if (obs.windSpeed) {
//           const match = obs.windSpeed.match(/(\d+)(?:\s*to\s*(\d+))?/);
//           const windMin = match ? parseFloat(match[1]) : null;
//           const windMax = match && match[2] ? parseFloat(match[2]) : windMin;

//           if (
//             windMin != null &&
//             windMax != null &&
//             min != null &&
//             max != null
//           ) {
//             if (windMax >= min && windMin <= max) {
//               alerts.push(
//                 `${direction} direction wind will be between ${min}–${max} mph on ${obs.date_and_time}`
//               );
//             }
//           }
//         }
//       }
//     }
//   }

//   return alerts;
// }

// cron.schedule("0 */3 * * *", async () => {
//   // cron.schedule("*/59 * * * * *", async () => {
//   console.log("[CRON] Running weather threshold check...");

//   try {
//     const batchSize = 20;
//     let skip = 0;
//     const triggeredAlerts = [];

//     while (true) {
//       const users = await prisma.user.findMany({
//         include: { Threshold: true },
//         skip,
//         take: batchSize,
//       });

//       if (!users || users.length === 0) break;

//       await Promise.all(
//         users.map(async (user) => {
//           if (!user.Threshold || !user.zoneId) return;

//           try {
//             const observations = await getZoneWeatherObservations(user.zoneId);
//             if (!observations || !observations.length) {
//               console.warn(`[CRON] No weather observations for ${user.email}`);
//               return;
//             }

//             for (const obs of observations) {
//               const alerts = checkThresholds(obs, user.Threshold);
//               if (alerts.length > 0) {
//                 const cacheKey = `${user.zoneId}:${alerts.join("|")}`;
//                 const lastAlert = getAlertCache(cacheKey);

//                 if (lastAlert !== cacheKey) {
//                   const alertMessage = alerts.join("; ");
//                   const { password, Threshold, ...safeUser } = user;
//                   triggeredAlerts.push({
//                     user: safeUser,
//                     alertMessage,
//                   });
//                   setAlertCache(cacheKey);

//                   console.log(
//                     `\n📢 ALERT TRIGGERED
//             ├─ User Details:
//             ${JSON.stringify(safeUser, null, 2)
//               .split("\n")
//               .map((line) => "  │  " + line)
//               .join("\n")}
//             ├─ Alerts:
//             │  ${alertMessage.split("; ").join("\n  │  ")}
//             └─ Time: ${new Date().toISOString()}\n`
//                   );
//                 }
//               }
//             }
//           } catch (err) {
//             console.error(
//               `[CRON] Weather fetch failed for ${user.email}:`,
//               err?.message ?? err
//             );
//           }
//         })
//       );

//       skip += batchSize;
//     }

//     if (triggeredAlerts.length > 0) {
//       for (const alert of triggeredAlerts) {
//         const messages = alert.alertMessage.split("; ").filter(Boolean);
//         for (const msg of messages) {
//           await sendNotification(alert.user, msg.trim());
//         }
//       }
//     }
//   } catch (err) {
//     console.error("[CRON] Job failed:", err?.message ?? err);
//   }
// });

import cron from "node-cron";
import { prisma } from "../prisma.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";

const dailyAlertCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function setDailyAlertCache(cacheKey) {
  dailyAlertCache.set(cacheKey, Date.now());
}

function getDailyAlertCache(cacheKey) {
  const timestamp = dailyAlertCache.get(cacheKey);
  if (!timestamp) return null;
  if (Date.now() - timestamp > CACHE_TTL) {
    dailyAlertCache.delete(cacheKey);
    return null;
  }
  return cacheKey;
}

// Group observations by date and check thresholds
export function checkThresholds(observations, threshold) {
  const dailyAlerts = {};

  observations.forEach((obs) => {
    // const date = obs.date; // e.g., "Dec 9, 2025"

    const raw = obs.date || obs.timestamp;
    const dateObj = raw ? new Date(raw) : null;

    const date = dateObj
      ? dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Unknown";

    if (!dailyAlerts[date]) {
      dailyAlerts[date] = {
        temperature: false,
        humidity: false,
        dispersion: false,
        wind: false,
      };
    }

    // Check temperature threshold
    if (
      threshold.temperature != null &&
      obs.temperature != null &&
      obs.temperature < threshold.temperature &&
      !dailyAlerts[date].temperature
    ) {
      dailyAlerts[date].temperature = {
        message: `Temperature will fall below ${threshold.temperature}°F on ${date}`,
        type: "temperature",
        date: date,
      };
    }

    // Check humidity threshold
    if (
      obs.relativeHumidity != null &&
      threshold.relativeHumidityMin != null &&
      threshold.relativeHumidityMax != null &&
      obs.relativeHumidity >= threshold.relativeHumidityMin &&
      obs.relativeHumidity <= threshold.relativeHumidityMax &&
      !dailyAlerts[date].humidity
    ) {
      dailyAlerts[date].humidity = {
        message: `Relative humidity will be within a range ${threshold.relativeHumidityMin}–${threshold.relativeHumidityMax}% on ${date}`,
        type: "humidity",
        date: date,
      };
    }

    // Check dispersion index threshold
    if (
      obs.dispersionIndex != null &&
      threshold.dispersionIndexMin != null &&
      threshold.dispersionIndexMax != null &&
      obs.dispersionIndex >= threshold.dispersionIndexMin &&
      obs.dispersionIndex <= threshold.dispersionIndexMax &&
      !dailyAlerts[date].dispersion
    ) {
      dailyAlerts[date].dispersion = {
        message: `Dispersion index will be within a range ${threshold.dispersionIndexMin}–${threshold.dispersionIndexMax} on ${date}`,
        type: "dispersion",
        date: date,
      };
    }

    // Check wind direction and speed threshold
    if (
      obs.windDirection != null &&
      obs.windSpeed != null &&
      !dailyAlerts[date].wind
    ) {
      let direction = obs.windDirection;

      // Convert numeric degrees to compass direction if needed
      if (typeof obs.windDirection === "number") {
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
            max != null &&
            windMax >= min &&
            windMin <= max
          ) {
            dailyAlerts[date].wind = {
              message: `${direction} Direction wind will be within a range ${min}–${max} mph on ${date}`,
              type: "wind",
              date: date,
            };
          }
        }
      }
    }
  });

  // Flatten the alerts into a single array
  const alerts = [];
  Object.keys(dailyAlerts).forEach((date) => {
    const dayAlerts = dailyAlerts[date];
    if (dayAlerts.temperature) alerts.push(dayAlerts.temperature);
    if (dayAlerts.humidity) alerts.push(dayAlerts.humidity);
    if (dayAlerts.dispersion) alerts.push(dayAlerts.dispersion);
    if (dayAlerts.wind) alerts.push(dayAlerts.wind);
  });

  return alerts;
}

cron.schedule("0 */6 * * *", async () => {
  // cron.schedule("*/10 * * * *", async () => {
  console.log("[CRON] Running weather threshold check...");

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

            // Send notifications only for uncached alerts
            for (const alert of alerts) {
              const cacheKey = `${user.id}:${alert.type}:${alert.date}`;
              const lastAlert = getDailyAlertCache(cacheKey);

              if (!lastAlert) {
                const { password, Threshold, ...safeUser } = user;
                await sendNotification(safeUser, alert.message);
                setDailyAlertCache(cacheKey);

                console.log(
                  `\n📢 ALERT SENT
                  ├─ User: ${user.email}
                  ├─ Type: ${alert.type}
                  ├─ Date: ${alert.date}
                  ├─ Message: ${alert.message}
                  └─ Time: ${new Date().toISOString()}\n`
                );
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
  } catch (err) {
    console.error("[CRON] Job failed:", err?.message ?? err);
  }
});
