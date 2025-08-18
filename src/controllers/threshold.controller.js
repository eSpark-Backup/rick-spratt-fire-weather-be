import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import * as thresholdService from "../services/threshold.service.js";

const createOrUpdateThreshold = asyncWrapper(async (req, res) => {
  const { tempMin, tempMax, rhMin, rhMax, windMin, windMax } = req.body;
  const userId = req.user.id;

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

  response.success(res, threshold, "Threshold fetched successfully");
});

export { createOrUpdateThreshold, getThreshold };
