import axios from "axios";
import { CustomError } from "../utils/custom_error.js";

const WEATHER_API_BASE = "https://api.weather.gov";

export const getAllZones = async ({
  area = "FL",
  type,
  limit = 500,
  effective,
  include_geometry = false,
} = {}) => {
  try {
    if (!area)
      throw new CustomError(
        "Area parameter is required",
        400,
        "VALIDATION_ERROR",
        { area }
      );

    const { data } = await axios.get(`${WEATHER_API_BASE}/zones`, {
      params: { area, type, limit, effective, include_geometry },
    });

    if (!data?.features || data.features.length === 0) {
      throw new CustomError(
        `No zones found for area ${area}`,
        404,
        "NOT_FOUND",
        { area, type }
      );
    }

    return data.features.map((zone) => ({
      id: zone.properties.id,
      name: zone.properties.name,
      type: zone.properties.type,
      state: zone.properties.state,
      effectiveDate: zone.properties.effectiveDate,
      expirationDate: zone.properties.expirationDate,
    }));
  } catch (error) {
    console.error("Weather Service - getAllZones Error:", {
      area,
      type,
      originalError: error.message,
      stack: error.stack,
    });

    if (error instanceof CustomError) throw error;

    throw new CustomError(
      `Failed to fetch zones for ${area}${type ? ` (${type})` : ""}`,
      502,
      "WEATHER_API_ERROR",
      { area, type, originalError: error.message }
    );
  }
};

// export const getZoneWeatherObservations = async (
//   zoneId,
//   { start, end, limit = 500 } = {}
// ) => {
//   try {
//     if (!zoneId)
//       throw new CustomError(
//         "zoneId parameter is required",
//         400,
//         "VALIDATION_ERROR",
//         { zoneId }
//       );

//     const { data } = await axios.get(
//       `${WEATHER_API_BASE}/zones/forecast/${zoneId}/observations`,
//       {
//         params: { start, end, limit },
//       }
//     );

//     if (!data?.features || data.features.length === 0) {
//       throw new CustomError(
//         `No weather observations found for zone ${zoneId}`,
//         404,
//         "NOT_FOUND",
//         { zoneId }
//       );
//     }

//     return data.features.map((obs) => ({
//       timestamp: obs.properties.timestamp,
//       temperature: obs.properties.temperature?.value ?? null,
//       relativeHumidity: obs.properties.relativeHumidity?.value ?? null,
//       windDirection: obs.properties.windDirection?.value ?? null,
//       windSpeed: obs.properties.windSpeed?.value ?? null,
//     }));
//   } catch (error) {
//     console.error("Weather Service - getZoneWeatherObservations Error:", {
//       zoneId,
//       start,
//       end,
//       limit,
//       originalError: error.message,
//       stack: error.stack,
//     });

//     if (error instanceof CustomError) throw error;

//     throw new CustomError(
//       `Failed to fetch weather observations for zone ${zoneId}`,
//       502,
//       "WEATHER_API_ERROR",
//       { zoneId, start, end, originalError: error.message }
//     );
//   }
// };

export const getZoneWeatherObservations = async (
  zoneId,
  { start, end, limit = 500 } = {}
) => {
  try {
    if (!zoneId)
      throw new CustomError(
        "zoneId parameter is required",
        400,
        "VALIDATION_ERROR",
        { zoneId }
      );

    const { data } = await axios.get(
      `${WEATHER_API_BASE}/zones/forecast/${zoneId}/observations`,
      {
        params: { start, end, limit },
      }
    );

    if (!data?.features || data.features.length === 0) {
      throw new CustomError(
        `No weather observations found for zone ${zoneId}`,
        404,
        "NOT_FOUND",
        { zoneId }
      );
    }

    // ── Backend transformations for client feedback ──
    return data.features.map((obs) => {
      const p = obs.properties;

      // convert °C → °F (round to 1 decimal)
      const tempF =
        p.temperature?.value != null
          ? (p.temperature.value * 9) / 5 + 32
          : null;

      // compute compass direction from degrees
      const deg = p.windDirection?.value;
      const compass =
        deg == null
          ? null
          : (() => {
              const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
              return dirs[Math.round(deg / 45) % 8];
            })();

      // convert km/h → mph
      const windMph =
        p.windSpeed?.value != null
          ? +(p.windSpeed.value * 0.621371).toFixed(1)
          : null;

      return {
        timestamp: p.timestamp,
        // Temperature returned in Fahrenheit
        temperatureF: tempF,
        // For min humidity calculation downstream; keep value as-is
        relativeHumidity: p.relativeHumidity?.value ?? null,
        // Compass direction instead of raw degrees
        windDirection: compass,
        windDirectionValue: obs.properties.windDirection?.value ?? null,
        // Wind speed in mph
        windSpeedMph: windMph,
      };
    });
  } catch (error) {
    console.error("Weather Service - getZoneWeatherObservations Error:", {
      zoneId,
      start,
      end,
      limit,
      originalError: error.message,
      stack: error.stack,
    });

    if (error instanceof CustomError) throw error;

    throw new CustomError(
      `Failed to fetch weather observations for zone ${zoneId}`,
      502,
      "WEATHER_API_ERROR",
      { zoneId, start, end, originalError: error.message }
    );
  }
};

export const getZoneById = async (zoneId) => {
  if (!zoneId)
    throw new CustomError("zoneId required", 400, "VALIDATION_ERROR");
  const zones = await getAllZones({ limit: 500 }); // or filter by area if needed
  return zones.find((z) => z.id === zoneId) || null;
};
