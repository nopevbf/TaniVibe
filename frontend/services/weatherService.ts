import { WeatherData } from '../types';

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Gagal mengambil data cuaca');
  }
  
  return await response.json();
};

export const fetchCoordinates = async (name: string): Promise<{lat: number, lon: number, name: string}> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=id&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Gagal mencari lokasi');
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('Lokasi tidak ditemukan. Coba nama yang lebih spesifik.');
  }
  const result = data.results[0];
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: result.name + (result.admin1 ? `, ${result.admin1}` : '')
  };
};
