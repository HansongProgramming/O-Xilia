import type { GanttData } from "../types/gantt";
import { DAY_WIDTH } from "../constants/gantt";

export const getDateRange = (ganttData: GanttData) => {
  if (ganttData.tasks.length === 0) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 3);
    return { start: today, end: endDate };
  }

  const dates = ganttData.tasks.flatMap((t) => [
    new Date(t.start),
    new Date(t.end),
  ]);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Add padding - start from beginning of month
  const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  // End at end of next month after max date
  const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

  return { start: startDate, end: endDate };
};

export const dateToPixels = (date: Date, startDate: Date) => {
  const days = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return days * DAY_WIDTH;
};

export const generateDays = (startDate: Date, endDate: Date) => {
  const days: { date: Date; dayOfWeek: string; dayOfMonth: number }[] = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    days.push({
      date: new Date(currentDate),
      dayOfWeek: currentDate.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      dayOfMonth: currentDate.getDate(),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

export const generateMonthHeaders = (
  days: ReturnType<typeof generateDays>
) => {
  const months: {
    month: string;
    year: number;
    dayCount: number;
    startIndex: number;
  }[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let dayCount = 0;
  let startIndex = 0;

  days.forEach((day, index) => {
    const month = day.date.getMonth();
    const year = day.date.getFullYear();

    if (month !== currentMonth || year !== currentYear) {
      if (currentMonth !== -1) {
        months.push({
          month: new Date(currentYear, currentMonth).toLocaleDateString(
            "en-US",
            {
              month: "short",
            }
          ),
          year: currentYear,
          dayCount: dayCount,
          startIndex: startIndex,
        });
      }
      currentMonth = month;
      currentYear = year;
      dayCount = 1;
      startIndex = index;
    } else {
      dayCount++;
    }
  });

  // Add the last month
  if (currentMonth !== -1) {
    months.push({
      month: new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
        month: "short",
      }),
      year: currentYear,
      dayCount: dayCount,
      startIndex: startIndex,
    });
  }

  return months;
};

export const getTodayPosition = (
  days: ReturnType<typeof generateDays>
): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIndex = days.findIndex((day) => {
    const d = new Date(day.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  return todayIndex >= 0 ? todayIndex * DAY_WIDTH : -1;
};