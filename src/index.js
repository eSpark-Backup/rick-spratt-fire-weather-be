import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./jobs/weather.job.js";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import { authRoutes } from "./routes/auth.routes.js";
import { weatherRoutes } from "./routes/weather.routes.js";
import { thresholdRoutes } from "./routes/threshold.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { errorHandler } from "./middlewares/error_handler.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

dotenv.config();
// __dirname replacement in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to your Firebase service account file
const serviceAccountPath = path.join(__dirname, "./firebase-service-account.json");

// Load JSON file safely
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
function initFirebaseIfNeeded() {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("[FCM] Firebase Admin initialized");
  } catch (err) {
    console.error("[FCM] Firebase initialization failed:", String(err));
  }
}

initFirebaseIfNeeded();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);

app.use("/api/weather", weatherRoutes);

app.use("/api/threshold", thresholdRoutes);

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

app.get("/", (_req, res) => {
  res.json({ message: "Hello, world!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
