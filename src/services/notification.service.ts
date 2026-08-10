import { prisma } from "../prisma.js";
import { CustomError } from "../utils/custom_error.js";
import admin from "firebase-admin";

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
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  // console.log("[FCM] Sending payload:", JSON.stringify(payload, null, 2));

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Weather Alert",
      body: message,
      type: "weather_alert",
      severity: "high",
    },
  });

  try {
    const fcmResponse = await admin.messaging().send(payload);
    console.log("[FCM] Response:", fcmResponse);
    console.log(`[FCM] Sent to ${user.email || user.id}:`, fcmResponse);

    return { success: true, userId: user.id, notificationId: notification.id };
  } catch (err) {
    console.error(`[FCM] Failed for user ${user.id}`, err?.message ?? err);
    return {
      success: false,
      userId: user.id,
      error: err?.message || String(err),
    };
  }
}
