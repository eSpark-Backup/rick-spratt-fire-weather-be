// notification.test.js
import "dotenv/config.js";
import { prisma } from "../prisma.js";
import { sendNotification } from "../services/notification.service.js";

(async () => {
  try {
    // ⚠️ Replace these with real values
    const testEmail = "testuser@example.com"; // email to identify test user
    const testDeviceToken =
      "cmR16FqXS2ON7lBJ5Z3C3x:APA91bEw9mOghTIgYsuVjiiEoGAY4LEF-rsxlDCOhwidexHXqfKscROKqgrsN-VyL1ip2O3Jxl4sz1x58xyYZHrE4A-IyKd_m1Q91P5XnA2xcr2J5ySHD3k"; // from frontend device

    // Ensure test user exists in DB
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!user) {
      console.log("Creating test user in DB...");
      user = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: testEmail,
          password: "Dummy-password123#", // password not used for test
          country: "US",
          state: "Florida",
          zoneId: "TestZone",
          deviceToken: testDeviceToken,
        },
      });
    } else {
      // Update deviceToken if needed
      if (user.deviceToken !== testDeviceToken) {
        await prisma.user.update({
          where: { id: user.id },
          data: { deviceToken: testDeviceToken },
        });
      }
    }

    // Send test notification
    const message = "🔥 Temperature exceeded threshold!";
    const result = await sendNotification(user, message);

    console.log("✅ Test notification sent successfully");
    console.log("Result:", result);
  } catch (err) {
    console.error("❌ Notification test failed:");
    console.error("Error:", err.message);
    if (err.details) console.error("Details:", err.details);
  } finally {
    process.exit();
  }
})();
