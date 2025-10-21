import axios from 'axios';

export interface WeatherData {
  temp: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  description: string;
}

class WeatherService {
  private apiKey = process.env.WEATHER_API_KEY;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: this.apiKey,
          units: 'imperial',
        },
      });

      return {
        temp: Math.round(response.data.main.temp),
        feels_like: Math.round(response.data.main.feels_like),
        condition: response.data.weather[0].main,
        humidity: response.data.main.humidity,
        wind_speed: Math.round(response.data.wind.speed),
        description: response.data.weather[0].description,
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return this.getMockWeather();
    }
  }

  private getMockWeather(): WeatherData {
    return {
      temp: 72,
      feels_like: 70,
      condition: 'Clear',
      humidity: 65,
      wind_speed: 8,
      description: 'clear sky',
    };
  }
}

export const weatherService = new WeatherService();
