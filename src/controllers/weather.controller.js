// import { asyncWrapper } from "../utils/async_wrapper.js";
// import * as response from "../utils/response.js";
// import {
//   getFireZones,
//   getZoneWeatherObservations,
// } from "../services/weather.service.js";
// import { paginate } from "../utils/pagination.js";

// const getZones = asyncWrapper(async (req, res) => {
//   const { area, type, limit, effective, include_geometry } = req.query;
  

//   const zones = await getFireZones({
//     area,
//     type,
//     limit,
//     effective,
//     include_geometry,
//   });

//   response.success(res, { zones }, "Zones fetched successfully");
// });

// const getWeather = asyncWrapper(async (req, res) => {
//   const { zoneId } = req.params;
//   const { start, end, limit } = req.query;

//   const weatherData = await getZoneWeatherObservations(zoneId, {
//     start,
//     end,
//     limit,
//   });

//   response.success(
//     res,
//     { weather: weatherData },
//     `Weather observations fetched successfully for zone ${zoneId}`
//   );
// });

// export { getZones, getWeather };
import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import { getFireZones, getZoneWeatherObservations } from "../services/weather.service.js";
import { paginate } from "../utils/pagination.js";

const getZones = asyncWrapper(async (req, res) => {
  const { area, type, limit: queryLimit, effective, include_geometry, page = 1, limit = 10 } = req.query;

  const zones = await getFireZones({
    area,
    type,
    limit: 500,
    effective,
    include_geometry,
  });

  const paginatedResult = paginate(zones, page, queryLimit || limit);

  response.success(res, paginatedResult, "Zones fetched successfully");
});

const getWeather = asyncWrapper(async (req, res) => {
  const { zoneId } = req.params;
  const { start, end, page = 1, limit = 10 } = req.query;

  const weatherData = await getZoneWeatherObservations(zoneId, {
    start,
    end,
    limit: 500,
  });

  const paginatedResult = paginate(weatherData, page, limit);

  response.success(
    res,
    paginatedResult,
    `Weather observations fetched successfully for zone ${zoneId}`
  );
});

export { getZones, getWeather };
