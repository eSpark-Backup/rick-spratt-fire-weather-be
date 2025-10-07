import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import * as thresholdService from "../services/threshold.service.js";
import { CustomError } from "../utils/custom_error.js";

const requireNumericFields = (body, fields) => {
  for (const field of fields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      isNaN(body[field])
    ) {
      throw new CustomError(
        `${field} is required and must be a number`,
        400,
        "VALIDATION_ERROR",
        { field }
      );
    }
  }
};

const formatThresholdResponse = (t) => ({
  temperature: t.temperature ?? null,
  humidity: t.humidity ?? null,
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
  const { temperature, humidity, wind_speed } = req.body;
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
    humidity,
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
