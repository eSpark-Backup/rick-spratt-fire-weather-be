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
  console.log("[FCM] Firebase Admin initialized");
}

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
    return;
  }

  const payload = {
    token: user.deviceToken,
    notification: {
      title: "Weather Alert",
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
