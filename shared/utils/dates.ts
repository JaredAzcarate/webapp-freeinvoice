import { DateTime } from "luxon";

/**
 * Get date range for last week (past and future from today)
 * Returns events from 7 days ago to 7 days from now
 *
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Object with timeMin and timeMax in RFC3339 format
 */
export function getLastWeekRange(timeZone = "Europe/Madrid"): {
  timeMin: string;
  timeMax: string;
} {
  const today = DateTime.now().setZone(timeZone).startOf("day");
  const weekAgo = today.minus({ weeks: 1 });
  const weekAhead = today.plus({ weeks: 1 });

  return {
    timeMin: weekAgo.toISO()!,
    timeMax: weekAhead.toISO()!,
  };
}

/**
 * Get date range for last month (complete previous month)
 * Returns events from start of previous month to end of previous month
 *
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Object with timeMin and timeMax in RFC3339 format
 */
export function getLastMonthRange(timeZone = "Europe/Madrid"): {
  timeMin: string;
  timeMax: string;
} {
  const today = DateTime.now().setZone(timeZone);
  const previousMonth = today.minus({ months: 1 });
  const monthStart = previousMonth.startOf("month");
  // Add 1 day to endOf month to ensure we include all events on the last day
  // Google Calendar API uses exclusive end time, so we need to include the start of the next day
  const nextMonthStart = previousMonth.plus({ months: 1 }).startOf("month");

  return {
    timeMin: monthStart.toISO()!,
    timeMax: nextMonthStart.toISO()!,
  };
}

/**
 * Get date range for last year (past and future from today)
 * Returns events from 1 year ago to 1 year from now
 *
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Object with timeMin and timeMax in RFC3339 format
 */
export function getLastYearRange(timeZone = "Europe/Madrid"): {
  timeMin: string;
  timeMax: string;
} {
  const today = DateTime.now().setZone(timeZone).startOf("day");
  const yearAgo = today.minus({ years: 1 });
  const yearAhead = today.plus({ years: 1 });

  return {
    timeMin: yearAgo.toISO()!,
    timeMax: yearAhead.toISO()!,
  };
}

/**
 * Get date range for a specific month
 * Returns events from start of month to end of month
 *
 * @param dateTime - DateTime object representing the month
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Object with timeMin and timeMax in RFC3339 format
 */
export function getMonthRange(
  dateTime: DateTime,
  timeZone = "Europe/Madrid"
): {
  timeMin: string;
  timeMax: string;
} {
  const monthStart = dateTime.setZone(timeZone).startOf("month");
  const nextMonthStart = monthStart.plus({ months: 1 }).startOf("month");

  return {
    timeMin: monthStart.toISO()!,
    timeMax: nextMonthStart.toISO()!,
  };
}

export type MonthOption = {
  value: string;
  label: string;
};

/**
 * Months from January of the current year through the current month (inclusive).
 */
export function getYearMonthsUpToToday(timeZone = "Europe/Madrid"): MonthOption[] {
  const now = DateTime.now().setZone(timeZone);
  const months: MonthOption[] = [];

  for (let month = 1; month <= now.month; month++) {
    const date = DateTime.fromObject(
      { year: now.year, month, day: 1 },
      { zone: timeZone }
    );
    months.push({
      value: `${now.year}-${String(month).padStart(2, "0")}`,
      label: date.setLocale("es").toFormat("LLLL yyyy"),
    });
  }

  return months.reverse();
}

/**
 * Date range for a calendar month key (YYYY-MM).
 * Current month ends at today; past months use the full month.
 */
export function getDateRangeFromMonthKey(
  monthKey: string,
  timeZone = "Europe/Madrid"
): {
  timeMin: string;
  timeMax: string;
} {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const monthStart = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: timeZone }
  ).startOf("month");
  const now = DateTime.now().setZone(timeZone);
  const isCurrentMonth = now.year === year && now.month === month;
  const nextMonthStart = monthStart.plus({ months: 1 }).startOf("month");
  const timeMax = isCurrentMonth
    ? now.startOf("day").plus({ days: 1 })
    : nextMonthStart;

  return {
    timeMin: monthStart.toISO()!,
    timeMax: timeMax.toISO()!,
  };
}

/**
 * Custom inclusive date range (start and end dates).
 */
export function getCustomDateRange(
  startDate: DateTime,
  endDate: DateTime,
  timeZone = "Europe/Madrid"
): {
  timeMin: string;
  timeMax: string;
} {
  const timeMin = startDate.setZone(timeZone).startOf("day");
  const timeMax = endDate.setZone(timeZone).startOf("day").plus({ days: 1 });

  return {
    timeMin: timeMin.toISO()!,
    timeMax: timeMax.toISO()!,
  };
}
