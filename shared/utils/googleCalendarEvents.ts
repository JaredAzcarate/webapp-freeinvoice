import { CalendarEvent } from "@/features/welcome/types/apiTypesCalendar";
import { DateTime, Duration } from "luxon";

/**
 * Extract client name from event summary
 * Looks for patterns: " — ClientName", "- ClientName", "— ClientName", "– ClientName"
 *
 * @param summary - Event summary text
 * @returns Client name or null if not found
 */
export function extractClientFromSummary(summary: string): string | null {
  if (!summary) return null;

  // Patterns to match:
  // " — Client" (em dash with spaces)
  // "- Client" (hyphen with space)
  // "— Client" (em dash without space before)
  // "– Client" (en dash with space)
  // "–Client" (en dash without space before)
  const patterns = [
    / — (.+)$/, // " — ClientName" (em dash with spaces)
    / - (.+)$/, // "- ClientName" (hyphen with space)
    /— (.+)$/, // "— ClientName" (em dash without space before)
    / – (.+)$/, // " – ClientName" (en dash with spaces)
    /– (.+)$/, // "– ClientName" (en dash with space after)
    /–(.+)$/, // "–ClientName" (en dash without space)
  ];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Get DateTime from event start or end
 * Handles both dateTime (with time) and date (all-day events)
 *
 * @param eventTime - Event time object with dateTime or date
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns DateTime object or null if invalid
 */
function getEventDateTime(
  eventTime: CalendarEvent["start"] | CalendarEvent["end"],
  timeZone = "Europe/Madrid"
): DateTime | null {
  if (eventTime.dateTime) {
    const dt = DateTime.fromISO(eventTime.dateTime);
    return dt.isValid ? dt : null;
  }

  if (eventTime.date) {
    const dt = DateTime.fromISO(eventTime.date, { zone: timeZone });
    return dt.isValid ? dt : null;
  }

  return null;
}

/**
 * Calculate event duration
 *
 * @param event - Calendar event
 * @returns Duration object or null if invalid
 */
function getEventDuration(event: CalendarEvent): Duration | null {
  const startDateTime = getEventDateTime(event.start);
  const endDateTime = getEventDateTime(event.end);

  if (!startDateTime || !endDateTime) {
    return null;
  }

  const duration = endDateTime.diff(startDateTime);
  return duration.isValid ? duration : null;
}

/**
 * Get event duration broken down into hours, minutes, and seconds
 *
 * @param event - Calendar event
 * @returns Object with hours, minutes, seconds, and totals, or null if invalid
 */
export function formatEventDuration(event: CalendarEvent): {
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
} | null {
  // Check if it's an all-day event
  if (event.start.date && !event.start.dateTime) {
    const startDate = getEventDateTime(event.start);
    const endDate = getEventDateTime(event.end);

    if (startDate && endDate) {
      const days = endDate.diff(startDate, "days").days;
      return {
        hours: Math.floor(days) * 24,
        minutes: 0,
        seconds: 0,
        totalHours: days * 24,
        totalMinutes: days * 24 * 60,
        totalSeconds: days * 24 * 60 * 60,
      };
    }
    return null;
  }

  const duration = getEventDuration(event);

  if (!duration) {
    return null;
  }

  // Convert duration to hours, minutes, and seconds
  const shifted = duration.shiftTo("hours", "minutes", "seconds");

  return {
    hours: Math.floor(shifted.hours) || 0,
    minutes: Math.floor(shifted.minutes) || 0,
    seconds: Math.floor(shifted.seconds) || 0,
    totalHours: duration.as("hours"),
    totalMinutes: duration.as("minutes"),
    totalSeconds: duration.as("seconds"),
  };
}

/**
 * Get event time range in a compact format
 * Example: "10:00 - 12:00" or "16 abr - 18 abr"
 *
 * @param event - Calendar event
 * @param timeZone - Time zone for display (default: "Europe/Madrid")
 * @returns Formatted time range string
 */
export function formatEventTimeRange(
  event: CalendarEvent,
  timeZone = "Europe/Madrid"
): string {
  const startDateTime = getEventDateTime(event.start, timeZone);
  const endDateTime = getEventDateTime(event.end, timeZone);

  if (!startDateTime || !endDateTime) {
    return "Sin rango de tiempo";
  }

  const start = startDateTime.setZone(timeZone);
  const end = endDateTime.setZone(timeZone);

  // All-day event
  if (event.start.date && !event.start.dateTime) {
    const isSameDay = start.hasSame(end, "day");
    if (isSameDay) {
      return start.toLocaleString({
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return `${start.toLocaleString({
      day: "numeric",
      month: "short",
    })} - ${end.toLocaleString({
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  // Same day event with time
  const isSameDay = start.hasSame(end, "day");
  if (isSameDay) {
    return `${start.toLocaleString({
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleString({
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Multi-day event with time
  return `${start.toLocaleString({
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleString({
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Group calendar events by day
 *
 * @param events - Array of calendar events
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Map with date string as key and array of events as value
 */
function groupEventsByDay(
  events: CalendarEvent[],
  timeZone = "Europe/Madrid"
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const startDateTime = getEventDateTime(event.start, timeZone);

    if (!startDateTime) {
      return;
    }

    // Get date string in format YYYY-MM-DD
    const dateKey = startDateTime.setZone(timeZone).toISODate();

    if (!dateKey) {
      return;
    }

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(event);
  });

  return grouped;
}

/**
 * Group calendar events by day and return as array of objects
 *
 * @param events - Array of calendar events
 * @param timeZone - Time zone (default: "Europe/Madrid")
 * @returns Array of objects with date and events
 */
export function groupEventsByDayArray(
  events: CalendarEvent[],
  timeZone = "Europe/Madrid"
): Array<{ date: string; dateFormatted: string; events: CalendarEvent[] }> {
  const grouped = groupEventsByDay(events, timeZone);
  const result: Array<{
    date: string;
    dateFormatted: string;
    events: CalendarEvent[];
  }> = [];

  grouped.forEach((eventList, dateKey) => {
    const dateTime = DateTime.fromISO(dateKey, { zone: timeZone });
    const dateFormatted = dateTime.toLocaleString({
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });

    result.push({
      date: dateKey,
      dateFormatted,
      events: eventList,
    });
  });

  // Sort by date (ascending)
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}
