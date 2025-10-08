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
      { params: { start, end, limit } }
    );

    if (!data?.features?.length)
      throw new CustomError(
        `No weather observations found for zone ${zoneId}`,
        404,
        "NOT_FOUND",
        { zoneId }
      );

    const firstObs = data.features[0];
    let dispersionIndex = null;

    try {
      const coords = firstObs.geometry?.coordinates;
      if (coords?.length === 2) {
        const lon = coords[0];
        const lat = coords[1];

        const pointResp = await axios.get(
          `${WEATHER_API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`
        );
        const { gridId, gridX, gridY } = pointResp.data.properties;

        if (gridId && gridX != null && gridY != null) {
          const gridResp = await axios.get(
            `${WEATHER_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}`
          );
          const dispersionList =
            gridResp.data.properties?.dispersionIndex?.values ?? [];

          if (dispersionList.length) {
            const now = Date.now();
            const current = dispersionList.find((v) => {
              const [startStr, dur] = v.validTime.split("/");
              const start = new Date(startStr).getTime();
              let end = start;
              if (dur?.startsWith("PT") && dur.endsWith("H")) {
                const hrs = parseInt(dur.replace("PT", "").replace("H", ""));
                end += hrs * 3600000;
              }
              return now >= start && now < end;
            });
            dispersionIndex = current?.value ?? null;
          }
        }
      }
    } catch (e) {
      console.warn(
        `Could not fetch dispersionIndex for zone ${zoneId}:`,
        e.message
      );
      dispersionIndex = null;
    }

    return data.features.map((obs) => {
      const p = obs.properties;
      const tempF =
        p.temperature?.value != null
          ? +((p.temperature.value * 9) / 5 + 32).toFixed(1)
          : null;
      const windMph =
        p.windSpeed?.value != null
          ? +(p.windSpeed.value * 0.621371).toFixed(1)
          : null;
      const deg = p.windDirection?.value;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const compass = deg == null ? null : dirs[Math.round(deg / 45) % 8];

      return {
        timestamp: p.timestamp,
        temperature: tempF,
        relativeHumidity: p.relativeHumidity?.value ?? null,
        windDirection: compass,
        windSpeed: windMph,
        dispersionIndex,
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
  const zones = await getAllZones();
  return zones.find((z) => z.id === zoneId) || null;
};
