import axios from "axios";
import { CustomError } from "../utils/custom_error.js";

const WEATHER_API_BASE = "https://api.weather.gov";
export const getFireZones = async ({
  area = "FL",
  type = "fire",
  limit = 500,
  effective,
  include_geometry = false,
} = {}) => {
  try {
    const { data } = await axios.get(`${WEATHER_API_BASE}/zones`, {
      params: {
        area,
        type,
        limit,
        effective,
        include_geometry,
      },
    });

    return data.features.map((zone) => ({
      id: zone.properties.id,
      name: zone.properties.name,
      type: zone.properties.type,
      state: zone.properties.state,
      effectiveDate: zone.properties.effectiveDate,
      expirationDate: zone.properties.expirationDate
    }));
  } catch (error) {
    throw new CustomError(
      `Failed to fetch ${type} zones for ${area}`, 502
    );
  }
};

export const getZoneWeatherObservations = async (
  zoneId,
  { start, end, limit } = {}
) => {
  try {
    const { data } = await axios.get(
      `${WEATHER_API_BASE}/zones/forecast/${zoneId}/observations`,
      {
        params: {
          start,
          end,
          limit,
        },
      }
    );

    return data.features.map((obs) => ({
      timestamp: obs.properties.timestamp,
      temperature: obs.properties.temperature?.value ?? null,
      dewpoint: obs.properties.dewpoint?.value ?? null,
      windDirection: obs.properties.windDirection?.value ?? null,
      windSpeed: obs.properties.windSpeed?.value ?? null,
      windGust: obs.properties.windGust?.value ?? null,
      pressure: obs.properties.barometricPressure?.value ?? null,
      seaLevelPressure: obs.properties.seaLevelPressure?.value ?? null,
      visibility: obs.properties.visibility?.value ?? null,
      maxTemperatureLast24Hours:
        obs.properties.maxTemperatureLast24Hours?.value ?? null,
      minTemperatureLast24Hours:
        obs.properties.minTemperatureLast24Hours?.value ?? null,
      precipitationLastHour:
        obs.properties.precipitationLastHour?.value ?? null,
      precipitationLast3Hours:
        obs.properties.precipitationLast3Hours?.value ?? null,
      relativeHumidity: obs.properties.relativeHumidity?.value ?? null,
      windChill: obs.properties.windChill?.value ?? null,
      heatIndex: obs.properties.heatIndex?.value ?? null,
      textDescription: obs.properties.textDescription,
      cloudBase: obs.properties.cloudLayers?.[0]?.base?.value ?? null,
      cloudAmount: obs.properties.cloudLayers?.[0]?.amount ?? null,
    }));
  } catch (error) {
    throw new CustomError(
      `Failed to fetch weather observations for zone ${zoneId}`, 502
    );
  }
};
