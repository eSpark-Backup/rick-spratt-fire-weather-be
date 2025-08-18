import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { authRoutes } from "./routes/auth.routes.js";
import { weatherRoutes } from "./routes/weather.routes.js";
import { thresholdRoutes } from "./routes/threshold.routes.js";
import { errorHandler } from "./middlewares/error_handler.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

dotenv.config();

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


app.use(errorHandler);

app.get("/", (_req, res) => {
  res.json({ message: "Hello, world!" });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
