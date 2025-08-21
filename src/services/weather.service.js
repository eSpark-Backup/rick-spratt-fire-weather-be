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

    return data.features.map((obs) => ({
      timestamp: obs.properties.timestamp,
      temperature: obs.properties.temperature?.value ?? null,
      Humidity: obs.properties.relativeHumidity?.value ?? null,
      windDirection: obs.properties.windDirection?.value ?? null,
      windSpeed: obs.properties.windSpeed?.value ?? null,
    }));
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
