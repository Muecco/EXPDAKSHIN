import type { WeatherCondition, WeatherState } from '../types/weather';
import type { StationId } from '../types';

export function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

export const WEATHER_PRESETS: Record<WeatherState, Partial<WeatherCondition>> = {
  CLEAR: {
    snowIntensity: 0.04,
    windSpeed: 3.5,
    windDirection: 90,
    windDirectionCardinal: 'E',
    weatherState: 'CLEAR',
    visibilityKm: 45.0,
  },
  LIGHT_SNOW: {
    snowIntensity: 0.25,
    windSpeed: 8.0,
    windDirection: 100,
    windDirectionCardinal: 'E',
    weatherState: 'LIGHT_SNOW',
    visibilityKm: 22.0,
  },
  MODERATE_SNOW: {
    snowIntensity: 0.50,
    windSpeed: 14.2,
    windDirection: 110,
    windDirectionCardinal: 'ESE',
    weatherState: 'MODERATE_SNOW',
    visibilityKm: 12.5,
  },
  HEAVY_SNOW: {
    snowIntensity: 0.75,
    windSpeed: 20.0,
    windDirection: 115,
    windDirectionCardinal: 'ESE',
    weatherState: 'HEAVY_SNOW',
    visibilityKm: 4.8,
  },
  BLIZZARD: {
    snowIntensity: 1.00,
    windSpeed: 34.0,
    windDirection: 135,
    windDirectionCardinal: 'SE',
    weatherState: 'BLIZZARD',
    visibilityKm: 1.2,
  },
};

export function getDefaultStationWeather(stationId: StationId): WeatherCondition {
  if (stationId === 'bharati') {
    return {
      temperature: -31.8,
      windSpeed: 18.0,
      windDirection: 110,
      windDirectionCardinal: 'ESE',
      snowIntensity: 0.70,
      weatherState: 'HEAVY_SNOW',
      visibilityKm: 6.2,
    };
  }

  // Maitri default
  return {
    temperature: -28.4,
    windSpeed: 14.2,
    windDirection: 110,
    windDirectionCardinal: 'ESE',
    snowIntensity: 0.50,
    weatherState: 'MODERATE_SNOW',
    visibilityKm: 12.0,
  };
}
