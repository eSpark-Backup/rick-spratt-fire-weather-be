import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import * as thresholdService from "../services/threshold.service.js";
import { CustomError } from "../utils/custom_error.js";
import { getZoneWeatherObservations } from "../services/weather.service.js";
import { sendNotification } from "../services/notification.service.js";
import { checkThresholds } from "../jobs/weather.job.js";
import { prisma } from "../prisma.js";

const formatThresholdResponse = (t) => ({
  temperature: t.temperature ?? null,
  humidity: {
    min: t.relativeHumidityMin ?? null,
    max: t.relativeHumidityMax ?? null,
  },
  dispersion_index: {
    min: t.dispersionIndexMin ?? null,
    max: t.dispersionIndexMax ?? null,
  },
  wind_speed: {
    N: { min: t.northDirMin ?? null, max: t.northDirMax ?? null },
    NE: { min: t.northEastDirMin ?? null, max: t.northEastDirMax ?? null },
    E: { min: t.eastDirMin ?? null, max: t.eastDirMax ?? null },
    SE: { min: t.southEastDirMin ?? null, max: t.southEastDirMax ?? null },
    S: { min: t.southDirMin ?? null, max: t.southDirMax ?? null },
    SW: { min: t.southWestDirMin ?? null, max: t.southWestDirMax ?? null },
    W: { min: t.westDirMin ?? null, max: t.westDirMax ?? null },
    NW: { min: t.northWestDirMin ?? null, max: t.northWestDirMax ?? null },
  },
});

const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
  const { temperature, humidity, dispersion_index, wind_speed } = req.body;
  const userId = req.user.id;

  // Map Joi-validated wind_speed into DB column names
  const map = {
    N: ["northDirMin", "northDirMax"],
    NE: ["northEastDirMin", "northEastDirMax"],
    E: ["eastDirMin", "eastDirMax"],
    SE: ["southEastDirMin", "southEastDirMax"],
    S: ["southDirMin", "southDirMax"],
    SW: ["southWestDirMin", "southWestDirMax"],
    W: ["westDirMin", "westDirMax"],
    NW: ["northWestDirMin", "northWestDirMax"],
  };

  const data = {
    temperature,
    relativeHumidityMin: humidity?.min ?? null,
    relativeHumidityMax: humidity?.max ?? null,
    dispersionIndexMin: dispersion_index?.min ?? null,
    dispersionIndexMax: dispersion_index?.max ?? null,
  };

  for (const d in map) {
    const w = wind_speed?.[d] || {};
    data[map[d][0]] = w.min ?? null; // ensure null if missing
    data[map[d][1]] = w.max ?? null;
  }

  const threshold = await thresholdService.createOrUpdateThreshold(
    userId,
    data
  );

  response.success(
    res,
    formatThresholdResponse(threshold),
    "Threshold created/updated successfully"
  );

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      zoneId: true,
      email: true,
      deviceToken: true,
    },
  });

  if (!user?.zoneId) {
    throw new CustomError("User zoneId is missing", 400, "ZONE_ID_REQUIRED");
  }
  if (!user.zoneId) {
    throw new CustomError("User zoneId is missing", 400, "ZONE_ID_REQUIRED");
  }
  const observations = await getZoneWeatherObservations(user.zoneId);
  const latestObs = observations?.[0];
  if (latestObs) {
    const alerts = checkThresholds(latestObs, threshold);
    if (alerts.length > 0) {
      for (const msg of alerts) {
        await sendNotification(user, msg.trim());
      }
    }
  }
});

const getThreshold = asyncWrapper(async (req, res) => {
  const userId = req.user.id;

  const threshold = await thresholdService.getUserThreshold(userId);
  if (!threshold)
    throw new CustomError("Threshold not set for user", 404, "NOT_FOUND");

  response.success(
    res,
    formatThresholdResponse(threshold),
    "Threshold fetched successfully"
  );
});

export { createOrUpdateThreshold, getThreshold };
