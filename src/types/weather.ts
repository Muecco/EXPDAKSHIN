export type WeatherState =
  | 'CLEAR'
  | 'LIGHT_SNOW'
  | 'MODERATE_SNOW'
  | 'HEAVY_SNOW'
  | 'BLIZZARD';

export interface WeatherCondition {
  temperature: number;          // Celsius
  windSpeed: number;            // m/s
  windDirection: number;        // degrees (0 = N, 90 = E, 180 = S, 270 = W)
  windDirectionCardinal: string;// e.g. "ESE", "NNE"
  snowIntensity: number;        // 0.0 to 1.0
  weatherState: WeatherState;
  visibilityKm: number;         // visual range
}
