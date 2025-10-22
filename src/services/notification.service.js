import { prisma } from "../prisma.js";
import { CustomError } from "../utils/custom_error.js";
import admin from "firebase-admin";

// let firebaseInitialized = false;
// let parsedServiceAccount = null;

// function safeParseFirebaseConfig() {
//   if (parsedServiceAccount) return parsedServiceAccount;

//   const raw = process.env.FIREBASE_CONFIG;
//   if (!raw) {
//     throw new CustomError(
//       "Missing FIREBASE_CONFIG environment variable",
//       500,
//       "FCM_CONFIG_MISSING"
//     );
//   }

//   let obj;
//   try {
//     obj = JSON.parse(raw);
//   } catch (err) {
//     throw new CustomError(
//       "Failed to parse FIREBASE_CONFIG JSON",
//       500,
//       "FCM_CONFIG_PARSE_ERROR",
//       { originalError: String(err) }
//     );
//   }

//   if (obj.private_key && typeof obj.private_key === "string") {
//     obj.private_key = obj.private_key.replace(/\\n/g, "\n");
//   } else if (obj.privateKey && typeof obj.privateKey === "string") {
//     obj.privateKey = obj.privateKey.replace(/\\n/g, "\n");
//   } else {
//     console.warn("[FCM] FIREBASE_CONFIG missing private_key field.");
//   }

//   parsedServiceAccount = obj;
//   return parsedServiceAccount;
// }

/**
 * Send push notification to a single user
 */
export async function sendNotification(user, message) {
  if (!user || !user.id) {
    throw new CustomError("Invalid user provided", 400, "FCM_INVALID_USER");
  }

  if (!user.deviceToken || typeof user.deviceToken !== "string") {
    console.warn(
      `[FCM] Skipped: No deviceToken for user ${user.email || user.id}`
    );
    return { skipped: true, reason: "no_device_token" };
  }

  if (!message || typeof message !== "string") {
    throw new CustomError("Invalid message", 400, "FCM_INVALID_MESSAGE");
  }

  // initFirebaseIfNeeded();

  const payload = {
    token: user.deviceToken,
    notification: {
      title: "Weather Alert",
      body: "Alert",
    },
    data: {
      type: "weather_alert",
      severity: "high",
    },
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  // console.log("[FCM] Sending payload:", JSON.stringify(payload, null, 2));

  try {
    const fcmResponse = await admin.messaging().send(payload);
    console.log("[FCM] Response:", fcmResponse);
    console.log(`[FCM] Sent to ${user.email || user.id}:`, fcmResponse);

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Weather Alert",
        body: message,
        type: "weather_alert",
        severity: "high",
      },
    });

    return { success: true, userId: user.id, notificationId: notification.id };
  } catch (err) {
    console.error(`[FCM] Failed for user`, err?.message ?? err);
    return { success: false, userId: user.id, error: err.message };
  }
}

/**
 * Send notification to all currently logged-in users (parallelized)
 */
export async function sendNotificationToAllLoggedInUsers(message) {
  if (!message || typeof message !== "string") {
    throw new CustomError("Invalid message", 400, "FCM_INVALID_MESSAGE");
  }

  // get logged-in users with deviceToken
  const users = await prisma.user.findMany({
    where: { deviceToken: { not: null } }, // assuming this means logged in
    select: { id: true, email: true, deviceToken: true },
  });

  // console.log("[FCM] Target users:", users);

  if (!users.length) {
    console.log("[FCM] No logged-in users with device tokens");
    return [];
  }

  // console.log(`[FCM] Sending notifications to ${users.length} users...`);

  const results = await Promise.allSettled(
    users.map((user) => sendNotification(user, message))
  );

  return results.map((res, i) => ({
    userId: users[i].id,
    status: res.status,
    ...(res.status === "fulfilled"
      ? res.value
      : { error: res.reason?.message }),
  }));
}
