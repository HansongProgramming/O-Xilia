// components/SidebarCalendar.tsx
import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle } from "lucide-react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SidebarCalendar() {
  const [date, setDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await response.json();
          setWeather(data.current_weather.weathercode);
        } catch (error) {
          console.error("Weather fetch failed:", error);
        }
      },
      () => setWeather("0")
    );
  }, []);

  const getWeatherIcon = () => {
    if (weather === null) return <Sun className="w-5 h-5" />;
    const code = parseInt(weather);
    if (code === 0 || code === 1) return <Sun className="w-5 h-5" />;
    if (code === 2 || code === 3) return <Cloud className="w-5 h-5" />;
    if (code >= 51 && code <= 67) return <CloudDrizzle className="w-5 h-5" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5" />;
    if (code >= 80) return <CloudRain className="w-5 h-5" />;
    return <Cloud className="w-5 h-5" />;
  };

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setDate(new Date(year, month - 1, 1))}>◀</button>
        <span>
          {date.toLocaleString("default", { month: "long" })} {year}
        </span>
        <button onClick={() => setDate(new Date(year, month + 1, 1))}>▶</button>
      </div>

      <div className="calendar-grid">
        {days.map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`calendar-day ${isToday ? "today" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
