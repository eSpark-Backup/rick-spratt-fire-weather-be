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

const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
  const {
    temperature,
    humidity,
    windSpeed,
    windSpeedMin,
    windSpeedMax,
    southDir,
    northDir,
    eastDir,
    westDir,
    northEastDir,
    northWestDir,
    southEastDir,
    southWestDir,
  } = req.body;

  const userId = req.user.id;

  requireNumericFields(req.body, [
    "temperature",
    "humidity",
    "windSpeed",
    "windSpeedMin",
    "windSpeedMax",
    "southDir",
    "northDir",
    "eastDir",
    "westDir",
    "northEastDir",
    "northWestDir",
    "southEastDir",
    "southWestDir",
  ]);

  const threshold = await thresholdService.createOrUpdateThreshold(userId, {
    temperature,
    humidity,
    windSpeed,
    windSpeedMin,
    windSpeedMax,
    southDir,
    northDir,
    eastDir,
    westDir,
    northEastDir,
    northWestDir,
    southEastDir,
    southWestDir,
  });

  response.success(res, threshold, "Threshold created/updated successfully");
});

const getThreshold = asyncWrapper(async (req, res) => {
  const userId = req.user.id;

  const threshold = await thresholdService.getUserThreshold(userId);
  if (!threshold)
    throw new CustomError("Threshold not set for user", 404, "NOT_FOUND");

  response.success(res, threshold, "Threshold fetched successfully");
});

export { createOrUpdateThreshold, getThreshold };
