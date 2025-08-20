import express from "express";
import { getZones, getWeather } from "../controllers/weather.controller.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import {
  getZonesValidator,
  getWeatherValidator,
} from "../validators/weather.validator.js";

const router = express.Router();

router.get(
  "/zones",
  authenticate,
  validate(getZonesValidator, "query"),
  getZones
);
router.get(
  "/zones/forecast/:zoneId/observations",
  authenticate,
  validate(getWeatherValidator, "params"),
  getWeather
);

export { router as weatherRoutes };
