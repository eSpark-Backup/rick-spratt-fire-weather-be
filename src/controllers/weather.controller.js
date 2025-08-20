import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import {
  getAllZones,
  getZoneWeatherObservations,
} from "../services/weather.service.js";
import { paginate } from "../utils/pagination.js";
import { CustomError } from "../utils/custom_error.js";

const requirePositiveNumber = (value, field) => {
  if (value !== undefined && (isNaN(value) || Number(value) <= 0)) {
    throw new CustomError(
      `${field} must be a positive number`,
      400,
      "VALIDATION_ERROR",
      { field }
    );
  }
};

const getZones = asyncWrapper(async (req, res) => {
  const {
    area = "FL",
    type,
    limit: queryLimit,
    effective,
    include_geometry,
    page = 1,
    limit = 10,
  } = req.query;

  requirePositiveNumber(page, "page");
  requirePositiveNumber(queryLimit || limit, "limit");

  const zones = await getAllZones({
    area,
    type,
    limit: 500,
    effective,
    include_geometry,
  });

  if (!zones || zones.length === 0) {
    throw new CustomError("No zones found", 404, "NOT_FOUND");
  }

  const paginatedResult = paginate(zones, page, queryLimit || limit);

  response.success(
    res,
    { zones: paginatedResult.items, meta: paginatedResult.meta },
    "Zones fetched successfully"
  );
});

const getWeather = asyncWrapper(async (req, res) => {
  const { zoneId } = req.params;
  const { start, end, page = 1, limit = 10 } = req.query;

  if (!zoneId)
    throw new CustomError("zoneId is required", 400, "VALIDATION_ERROR", {
      field: "zoneId",
    });
  requirePositiveNumber(page, "page");
  requirePositiveNumber(limit, "limit");

  const weatherData = await getZoneWeatherObservations(zoneId, {
    start,
    end,
    limit: 500,
  });

  if (!weatherData || weatherData.length === 0) {
    throw new CustomError(
      `No weather observations found for zone ${zoneId}`,
      404,
      "NOT_FOUND",
      { zoneId }
    );
  }

  const paginatedResult = paginate(weatherData, page, limit);

  response.success(
    res,
    { weather: paginatedResult.items, meta: paginatedResult.meta },
    `Weather observations fetched successfully for zone ${zoneId}`
  );
});

export { getZones, getWeather };
