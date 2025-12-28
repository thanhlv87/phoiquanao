
export interface WeatherData {
  temp: number;
  condition: string;
  isRaining: boolean;
  city: string;
}

const getWeatherCondition = (code: number): string => {
  if (code === 0) return "Trời quang đãng";
  if (code <= 3) return "Trời nhiều mây";
  if (code <= 48) return "Có sương mù";
  if (code <= 67) return "Có mưa nhỏ/vừa";
  if (code <= 82) return "Mưa rào";
  if (code <= 99) return "Có dông sét";
  return "Thời tiết bình thường";
};

export const fetchLocalWeather = async (): Promise<WeatherData | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation không khả dụng");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Parallel fetch: Weather from Open-Meteo and Place Name from Nominatim
          const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`),
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
          ]);

          if (!weatherRes.ok) throw new Error("Weather API error");
          
          const weatherData = await weatherRes.json();
          const geoData = await geoRes.json();
          
          const city = geoData.address.city || 
                       geoData.address.town || 
                       geoData.address.suburb || 
                       geoData.address.district ||
                       geoData.address.state ||
                       "Vị trí hiện tại";

          if (weatherData.current_weather) {
            const cw = weatherData.current_weather;
            resolve({
              temp: Math.round(cw.temperature),
              condition: getWeatherCondition(cw.weathercode),
              isRaining: cw.weathercode >= 51,
              city: city
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error("Weather fetch failed:", e);
          resolve(null);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        resolve(null);
      },
      { timeout: 8000 }
    );
  });
};
