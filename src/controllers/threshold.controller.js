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
  temperature: t.temperature,
  humidity: t.humidity,
  wind_speed: {
    N: { min: t.northDirMin, max: t.northDirMax },
    NE: { min: t.northEastDirMin, max: t.northEastDirMax },
    E: { min: t.eastDirMin, max: t.eastDirMax },
    SE: { min: t.southEastDirMin, max: t.southEastDirMax },
    S: { min: t.southDirMin, max: t.southDirMax },
    SW: { min: t.southWestDirMin, max: t.southWestDirMax },
    W: { min: t.westDirMin, max: t.westDirMax },
    NW: { min: t.northWestDirMin, max: t.northWestDirMax },
  },
});

// const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
//   const {
//     temperature,
//     humidity,

//     northDirMin,
//     northDirMax,
//     southDirMin,
//     southDirMax,
//     eastDirMin,
//     eastDirMax,
//     westDirMin,
//     westDirMax,

//     northEastDirMin,
//     northEastDirMax,
//     northWestDirMin,
//     northWestDirMax,
//     southEastDirMin,
//     southEastDirMax,
//     southWestDirMin,
//     southWestDirMax,
//   } = req.body;

//   const userId = req.user.id;

//   requireNumericFields(req.body, [
//     "temperature",
//     "humidity",

//     "northDirMin",
//     "northDirMax",
//     "southDirMin",
//     "southDirMax",
//     "eastDirMin",
//     "eastDirMax",
//     "westDirMin",
//     "westDirMax",

//     "northEastDirMin",
//     "northEastDirMax",
//     "northWestDirMin",
//     "northWestDirMax",
//     "southEastDirMin",
//     "southEastDirMax",
//     "southWestDirMin",
//     "southWestDirMax",
//   ]);

//   const threshold = await thresholdService.createOrUpdateThreshold(userId, {
//     temperature,
//     humidity,

//     northDirMin,
//     northDirMax,
//     southDirMin,
//     southDirMax,
//     eastDirMin,
//     eastDirMax,
//     westDirMin,
//     westDirMax,

//     northEastDirMin,
//     northEastDirMax,
//     northWestDirMin,
//     northWestDirMax,
//     southEastDirMin,
//     southEastDirMax,
//     southWestDirMin,
//     southWestDirMax,
//   });

//   response.success(
//     res,
//     formatThresholdResponse(threshold),
//     "Threshold created/updated successfully"
//   );
// });

const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
  const { temperature, humidity, wind_speed } = req.body;
  const userId = req.user.id;

  // quick top-level validation
  if (isNaN(temperature) || isNaN(humidity) || typeof wind_speed !== "object") {
    throw new CustomError("Invalid payload", 400, "VALIDATION_ERROR");
  }

  // flatten wind_speed directions into DB fields
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

  const data = { temperature, humidity };
  for (const d in map) {
    const w = wind_speed[d] || {};
    data[map[d][0]] = w.min;
    data[map[d][1]] = w.max;
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
