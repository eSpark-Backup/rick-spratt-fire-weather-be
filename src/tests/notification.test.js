import "dotenv/config.js";
import { sendNotification } from "../services/notification.service.js";

(async () => {
  try {
    await sendNotification(
      {
        id: "test-user-id", // required for prisma.notification.create
        deviceToken: "YOUR_DEVICE_TOKEN",
      },
      "Temperature exceeded threshold!"
    );

    console.log("Test complete ✅");
  } catch (err) {
    console.error("Notification test failed:", err.message);
  }
})();
