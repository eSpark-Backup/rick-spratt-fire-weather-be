// import { asyncWrapper } from "../utils/async_wrapper.js";
// import * as response from "../utils/response.js";
// import * as thresholdService from "../services/threshold.service.js";

// const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
//   const { tempMin, tempMax, rhMin, rhMax, windMin, windMax } = req.body;
//   const userId = req.user.id;

//   const threshold = await thresholdService.createOrUpdateThreshold(userId, {
//     tempMin,
//     tempMax,
//     rhMin,
//     rhMax,
//     windMin,
//     windMax,
//   });

//   response.success(res, threshold, "Threshold created/updated successfully");
// });

// const getThreshold = asyncWrapper(async (req, res) => {
//   const userId = req.user.id;

//   const threshold = await thresholdService.getUserThreshold(userId);

//   response.success(res, threshold, "Threshold fetched successfully");
// });

// export { createOrUpdateThreshold, getThreshold };

import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import * as thresholdService from "../services/threshold.service.js";
import { CustomError } from "../utils/custom_error.js";

// Helper to validate required numeric fields
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
  const { tempMin, tempMax, rhMin, rhMax, windMin, windMax } = req.body;
  const userId = req.user.id;

  // Validate input fields
  requireNumericFields(req.body, [
    "tempMin",
    "tempMax",
    "rhMin",
    "rhMax",
    "windMin",
    "windMax",
  ]);

  // Optional: validate logical consistency
  if (tempMin > tempMax)
    throw new CustomError(
      "tempMin cannot be greater than tempMax",
      400,
      "LOGIC_ERROR",
      { field: "tempMin" }
    );
  if (rhMin > rhMax)
    throw new CustomError(
      "rhMin cannot be greater than rhMax",
      400,
      "LOGIC_ERROR",
      { field: "rhMin" }
    );
  if (windMin > windMax)
    throw new CustomError(
      "windMin cannot be greater than windMax",
      400,
      "LOGIC_ERROR",
      { field: "windMin" }
    );

  const threshold = await thresholdService.createOrUpdateThreshold(userId, {
    tempMin,
    tempMax,
    rhMin,
    rhMax,
    windMin,
    windMax,
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
