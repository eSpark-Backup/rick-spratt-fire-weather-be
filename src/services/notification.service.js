// import admin from "firebase-admin";

// let serviceAccount;
// try {
//   serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
//   serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
// } catch (err) {
//   console.error("[FCM] Invalid FIREBASE_CONFIG:", err.message);
//   throw new Error("Failed to parse Firebase config");
// }

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   console.log("[FCM] Firebase Admin initialized ✅");
// }

// export async function sendNotification(user, message) {
//   if (!user?.deviceToken) {
//     console.warn(
//       `[FCM] Skipped: No deviceToken for user ${user?.email || user?.id}`
//     );
//     return;
//   }

//   const payload = {
//     token: user.deviceToken,
//     notification: {
//       title: "Weather Alert ⚠️",
//       body: message,
//     },
//     data: {
//       type: "weather_alert",
//       severity: "high",
//     },
//   };

//   const MAX_RETRIES = 2;
//   const RETRY_DELAY = 1000;

//   for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
//     try {
//       const response = await admin.messaging().send(payload);
//       console.log(`[FCM] Sent to ${user.email}:`, response);
//       break;
//     } catch (err) {
//       if (attempt <= MAX_RETRIES) {
//         console.warn(
//           `[FCM] Retry ${attempt} for user ${user.email} after error: ${err.message}`
//         );
//         await new Promise((res) => setTimeout(res, RETRY_DELAY));
//       } else {
//         console.error(
//           `[FCM] Failed after ${MAX_RETRIES + 1} attempts:`,
//           err.message
//         );
//       }
//     }
//   }
// }

import admin from "firebase-admin";
import { CustomError } from "../utils/custom_error.js";

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("[FCM] Invalid FIREBASE_CONFIG:", err.message);
  throw new CustomError(
    "Failed to parse Firebase config",
    500,
    "FCM_CONFIG_ERROR",
    { originalError: err.message }
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("[FCM] Firebase Admin initialized ✅");
}

/**
 * Send a notification to a user with retry logic.
 * @param {Object} user - User object containing deviceToken
 * @param {string} message - Notification message
 * @param {number} [maxRetries=2] - Max retries
 * @param {number} [retryDelay=1000] - Delay between retries in ms
 */
export async function sendNotification(
  user,
  message,
  maxRetries = 2,
  retryDelay = 1000
) {
  if (!user?.deviceToken) {
    console.warn(
      `[FCM] Skipped: No deviceToken for user ${user?.email || user?.id}`
    );
    // Optional: throw if you want to track missed notifications
    // throw new CustomError("User has no device token", 400, "NO_DEVICE_TOKEN", { userId: user?.id });
    return;
  }

  const payload = {
    token: user.deviceToken,
    notification: {
      title: "Weather Alert ⚠️",
      body: message,
    },
    data: {
      type: "weather_alert",
      severity: "high",
    },
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await admin.messaging().send(payload);
      console.log(`[FCM] Sent to ${user.email || user.id}:`, response);
      break;
    } catch (err) {
      const isLastAttempt = attempt > maxRetries;
      console.warn(
        `[FCM] Attempt ${attempt} for user ${user.email || user.id} failed: ${
          err.message
        }`
      );

      if (isLastAttempt) {
        console.error(`[FCM] Failed to send after ${maxRetries + 1} attempts`, {
          userId: user.id,
          error: err.message,
        });
        // Throw structured error to be handled by global error handler if desired
        throw new CustomError(
          "Failed to send notification",
          500,
          "FCM_SEND_ERROR",
          { userId: user.id, originalError: err.message }
        );
      } else {
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }
}
