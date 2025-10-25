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

// export const getZoneWeatherObservations = async (zoneId) => {
//   try {
//     const obsResponse = await axios.get(
//       `https://api.weather.gov/zones/forecast/${zoneId}/observations`
//     );
//     const obsData = obsResponse.data;

//     if (!obsData || !obsData.features || !obsData.features.length) {
//       return null;
//     }

//     const latestObs = obsData.features[0];
//     const coordinates = latestObs.geometry?.coordinates;
//     const relativeHumidity = latestObs.properties?.relativeHumidity?.value;

//     if (!coordinates || coordinates.length < 2) {
//       return null;
//     }

//     const [lon, lat] = coordinates;

//     const pointRes = await axios.get(
//       `https://api.weather.gov/points/${lat},${lon}`
//     );
//     const { gridId, gridX, gridY } = pointRes.data.properties;

//     const gridForecastRes = await axios.get(
//       `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`
//     );
//     const forecastPeriod = gridForecastRes.data.properties?.periods?.[0];

//     const temperature = forecastPeriod?.temperature ?? null;
//     const windSpeed = forecastPeriod?.windSpeed ?? null;
//     const windDirection = forecastPeriod?.windDirection ?? null;

//     const gridRes = await axios.get(
//       `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`
//     );
//     const dispersionList =
//       gridRes.data.properties?.dispersionIndex?.values ?? [];
//     let dispersionIndex = null;

//     if (dispersionList.length) {
//       const now = Date.now();
//       const current = dispersionList.find((v) => {
//         const [startStr, dur] = v.validTime.split("/");
//         const start = new Date(startStr).getTime();
//         let end = start;
//         if (dur?.startsWith("PT") && dur.endsWith("H")) {
//           const hrs = parseInt(dur.replace("PT", "").replace("H", ""));
//           end += hrs * 3600000;
//         }
//         return now >= start && now < end;
//       });
//       dispersionIndex = current?.value ?? null;
//     }

//     return [
//       {
//         timestamp: new Date().toISOString(),
//         temperature,
//         relativeHumidity,
//         windDirection,
//         windSpeed,
//         dispersionIndex,
//       },
//     ];
//   } catch (error) {
//     console.error("Error fetching zone weather observations:", error.message);
//     return null;
//   }
// };

export const getZoneWeatherObservations = async (zoneId) => {
  try {
    const obsResponse = await axios.get(
      `https://api.weather.gov/zones/forecast/${zoneId}/observations`
    );
    const obsData = obsResponse.data;

    if (!obsData?.features?.length) return null;

    const latestObs = obsData.features[0];
    const coordinates = latestObs.geometry?.coordinates;
    const relativeHumidity = latestObs.properties?.relativeHumidity?.value;

    if (!coordinates || coordinates.length < 2) return null;

    const [lon, lat] = coordinates;

    const pointRes = await axios.get(
      `https://api.weather.gov/points/${lat},${lon}`
    );
    const { gridId, gridX, gridY } = pointRes.data.properties;

    // Fetch 7-day forecast data
    const gridForecastRes = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`
    );
    const forecastPeriods = gridForecastRes.data.properties?.periods ?? [];

    // Fetch dispersion index values
    const gridRes = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`
    );
    const dispersionList =
      gridRes.data.properties?.dispersionIndex?.values ?? [];

    // Combine forecast with matching dispersion index
    const weatherData = forecastPeriods.map((period) => {
      const forecastStart = new Date(period.startTime).getTime();
      let matchedDispersion = null;

      if (dispersionList.length) {
        const match = dispersionList.find((v) => {
          const [startStr, dur] = v.validTime.split("/");
          const start = new Date(startStr).getTime();
          let end = start;
          if (dur?.startsWith("PT") && dur.endsWith("H")) {
            const hrs = parseInt(dur.replace("PT", "").replace("H", ""));
            end += hrs * 3600000;
          }
          return forecastStart >= start && forecastStart < end;
        });
        matchedDispersion = match?.value ?? null;
      }

      return {
        timestamp: period.startTime,
        temperature: period.temperature ?? null,
        relativeHumidity,
        windDirection: period.windDirection ?? null,
        windSpeed: period.windSpeed ?? null,
        dispersionIndex: matchedDispersion,
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
