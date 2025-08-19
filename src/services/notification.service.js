import admin from "firebase-admin";

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("[FCM] Invalid FIREBASE_CONFIG:", err.message);
  throw new Error("Failed to parse Firebase config");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("[FCM] Firebase Admin initialized ✅");
}

export async function sendNotification(user, message) {
  if (!user?.deviceToken) {
    console.warn(
      `[FCM] Skipped: No deviceToken for user ${user?.email || user?.id}`
    );
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

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await admin.messaging().send(payload);
      console.log(`[FCM] Sent to ${user.email}:`, response);
      break;
    } catch (err) {
      if (attempt <= MAX_RETRIES) {
        console.warn(
          `[FCM] Retry ${attempt} for user ${user.email} after error: ${err.message}`
        );
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      } else {
        console.error(
          `[FCM] Failed after ${MAX_RETRIES + 1} attempts:`,
          err.message
        );
      }
    }
  }
}
