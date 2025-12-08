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
    // Step 1: Get point coordinates from zone observations
    const obsResponse = await axios.get(
      `https://api.weather.gov/zones/forecast/${zoneId}/observations`
    );
    const obsData = obsResponse.data;

    if (!obsData?.features?.length) return null;

    const latestObs = obsData.features[0];
    const coordinates = latestObs.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) return null;

    const [lon, lat] = coordinates;

    // Step 2: Convert coordinates to gridpoint
    const pointRes = await axios.get(
      `https://api.weather.gov/points/${lat},${lon}`
    );
    const { gridId, gridX, gridY } = pointRes.data.properties;

    // Step 3: Fetch raw gridpoint data with all parameters
    const gridRes = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`
    );
    const props = gridRes.data.properties;

    // Extract time-series arrays for each parameter
    const temperatureList = props?.temperature?.values ?? [];
    const humidityList = props?.relativeHumidity?.values ?? [];
    const dispersionList = props?.dispersionIndex?.values ?? [];
    const windDirectionList = props?.windDirection?.values ?? [];
    const windSpeedList = props?.windSpeed?.values ?? [];

    // Helper function to parse ISO 8601 duration and get end time
    const parseValidTime = (validTimeStr) => {
      const [startStr, dur] = validTimeStr.split("/");
      const start = new Date(startStr).getTime();
      let end = start;

      if (dur?.startsWith("PT") && dur.endsWith("H")) {
        const hrs = parseInt(dur.replace("PT", "").replace("H", ""));
        end += hrs * 3600000;
      }

      return { start, end };
    };

    // Helper function to find value for a specific timestamp
    const findValueAtTime = (timeSeriesList, targetTime) => {
      if (!timeSeriesList?.length) return null;

      const match = timeSeriesList.find((item) => {
        const { start, end } = parseValidTime(item.validTime);
        return targetTime >= start && targetTime < end;
      });

      return match?.value ?? null;
    };

    // Helper to convert wind direction degrees to compass
    const degreesToCompass = (deg) => {
      if (deg == null) return null;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      return dirs[Math.round(deg / 45) % 8];
    };

    // Helper to convert Celsius to Fahrenheit
    const celsiusToFahrenheit = (c) => {
      if (c == null) return null;
      return +((c * 9) / 5 + 32).toFixed(1);
    };

    // Helper to convert m/s to mph
    const kmhToMph = (kmh) => {
      if (kmh == null) return null;
      return +(kmh * 0.621371).toFixed(1);
    };

    // Collect all unique timestamps from all parameters
    const allTimestamps = new Set();
    [
      temperatureList,
      humidityList,
      dispersionList,
      windDirectionList,
      windSpeedList,
    ].forEach((list) => {
      list.forEach((item) => {
        const { start } = parseValidTime(item.validTime);
        allTimestamps.add(start);
      });
    });

    // Convert to sorted array (earliest first)
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Helper to format friendly date name
    const formatFriendlyName = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Build weather data array with all parameters matched by timestamp
    const weatherData = sortedTimestamps
      .slice(0, 168)
      .map((timestamp, index) => {
        const tempC = findValueAtTime(temperatureList, timestamp);
        const tempF = celsiusToFahrenheit(tempC);

        const humidity = findValueAtTime(humidityList, timestamp);

        const dispersion = findValueAtTime(dispersionList, timestamp);

        const windDirDeg = findValueAtTime(windDirectionList, timestamp);
        const windDir = degreesToCompass(windDirDeg);

        const windSpeedKmh = findValueAtTime(windSpeedList, timestamp);
        const windSpeedMph = kmhToMph(windSpeedKmh);

        return {
          timestamp: new Date(timestamp).toISOString(),
          number: index + 1,
          date: formatFriendlyName(timestamp),
          temperature: tempF,
          relativeHumidity: humidity,
          windDirection: windDir,
          windSpeed: windSpeedMph ?? null,
          dispersionIndex: dispersion,
        };
      });

    return weatherData;
  } catch (error) {
    console.error("Error fetching zone weather observations:", error.message);
    return null;
  }
};

export const getZoneById = async (zoneId) => {
  if (!zoneId)
    throw new CustomError("zoneId required", 400, "VALIDATION_ERROR");
  const zones = await getAllZones();
  return zones.find((z) => z.id === zoneId) || null;
};
