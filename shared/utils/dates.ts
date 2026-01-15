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
  const monthEnd = dateTime.setZone(timeZone).endOf("month");

  return {
    timeMin: monthStart.toISO()!,
    timeMax: monthEnd.toISO()!,
  };
}
