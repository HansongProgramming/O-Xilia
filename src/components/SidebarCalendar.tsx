// components/SidebarCalendar.tsx
import { useState } from "react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SidebarCalendar() {
  const [date, setDate] = useState(new Date());

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
