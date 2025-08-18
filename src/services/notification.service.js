import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.join(__dirname, "../../firebase-service-account.json")
    ),
  });
  console.log("[FCM] Firebase Admin initialized");
}

/**
 * Send push notification via FCM
 * @param {Object} user - User object containing deviceToken
 * @param {String} message - Notification message
 */
export async function sendNotification(user, message) {
  if (!user.deviceToken) {
    console.warn(`[FCM] No deviceToken for user: ${user.email}`);
    return;
  }

  const payload = {
    token: user.deviceToken,
    notification: {
      title: "Weather Alert ⚠️",
      body: message,
    },
    data: {
      userId: user.id,
      email: user.email,
    },
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log(`[FCM] Notification sent to ${user.email}:`, response);
  } catch (err) {
    console.error(`[FCM] Failed to send to ${user.email}:`, err.message);
  }
}
