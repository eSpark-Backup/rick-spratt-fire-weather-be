import axios from "axios";
import { CustomError } from "../utils/custom_error.js";

const WEATHER_API_BASE = "https://api.weather.gov";

export const getAllZones = async ({
  area = "FL",
  type,
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
      params: { area, type, effective, include_geometry },
    });

    if (!data?.features || data.features.length === 0) {
      throw new CustomError(
        `No zones found for area ${area}`,
        404,
        "NOT_FOUND",
        { area, type }
      );
    }

    // Filter zones: include only zones with at least one observation station
    const zonesWithData = data.features.filter(
      (zone) =>
        Array.isArray(zone.properties.observationStations) &&
        zone.properties.observationStations.length > 0
    );

    if (zonesWithData.length === 0) {
      throw new CustomError(
        `No zones with available weather data for area ${area}`,
        404,
        "NOT_FOUND",
        { area, type }
      );
    }

    return zonesWithData.map((zone) => ({
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

export const getZoneWeatherObservations = async (zoneId) => {
  try {
    const obsResponse = await axios.get(
      `https://api.weather.gov/zones/forecast/${zoneId}/observations`
    );
    const obsData = obsResponse.data;

    if (!obsData || !obsData.features || !obsData.features.length) {
      return null;
    }

    const latestObs = obsData.features[0];
    const coordinates = latestObs.geometry?.coordinates;
    const relativeHumidity = latestObs.properties?.relativeHumidity?.value;

    if (!coordinates || coordinates.length < 2) {
      return null;
    }

    const [lon, lat] = coordinates;

    const pointRes = await axios.get(
      `https://api.weather.gov/points/${lat},${lon}`
    );
    const { gridId, gridX, gridY } = pointRes.data.properties;

    const gridForecastRes = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`
    );
    const forecastPeriod = gridForecastRes.data.properties?.periods?.[0];

    const temperature = forecastPeriod?.temperature ?? null;
    const windSpeed = forecastPeriod?.windSpeed ?? null;
    const windDirection = forecastPeriod?.windDirection ?? null;

    const gridRes = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`
    );
    const dispersionIndex =
      gridRes.data.properties?.dispersionIndex?.value ?? null;

    return {
      timestamp: new Date().toISOString(),
      temperature,
      relativeHumidity,
      windDirection,
      windSpeed,
      dispersionIndex,
    };
  } catch (error) {
    logger.error("Error fetching zone weather observations:", error.message);
    return null;
  }
};

export const getZoneById = async (zoneId) => {
  if (!zoneId)
    throw new CustomError("zoneId required", 400, "VALIDATION_ERROR");
  const zones = await getAllZones();
  return zones.find((z) => z.id === zoneId) || null;
};
