import "dotenv/config.js";
import { sendNotification } from "../services/notification.service.js";

(async () => {
  try {
    await sendNotification(
      {
        deviceToken: "YOUR_DEVICE_TOKEN",
        email: "test@example.com",
      },
      "Temperature exceeded threshold!"
    ); 

    console.log("Test complete ✅");
  } catch (err) {
    console.error("❌ Notification test failed:", err.message);
  }
})();
