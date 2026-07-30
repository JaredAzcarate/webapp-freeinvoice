import type { WeeklyDigestUser } from "@/database/auth/users";
import type { CalendarEvent } from "@/features/welcome/types/apiTypesCalendar";
import type { DigestProjectRow } from "@/shared/services/email";
import {
  fetchPrimaryCalendarEvents,
  getValidAccessToken,
} from "@/shared/services/googleCalendar";
import {
  getCurrentWeekMonFriRange,
  getMonthToDateThroughFridayRange,
} from "@/shared/utils/dates";
import {
  extractClientFromSummary,
  formatEventDuration,
} from "@/shared/utils/googleCalendarEvents";
import { DateTime } from "luxon";

const DEFAULT_TIME_ZONE = "Europe/Madrid";
const NO_PROJECT_LABEL = "Sin proyecto";

export type WeeklyDigestResult = {
  weekHours: number;
  weekEarnings: number;
  monthHours: number;
  monthEarnings: number;
  projects: DigestProjectRow[];
  weekLabel: string;
  monthLabel: string;
  hourlyRate: number;
};

/**
 * Whether a project name is in the excluded list (case-insensitive).
 *
 * @param project - Project/client label from the event summary
 * @param excluded - User-configured excluded project names
 */
export function isProjectExcluded(
  project: string,
  excluded: string[]
): boolean {
  if (excluded.length === 0) {
    return false;
  }
  const projectKey = project.trim().toLowerCase();
  return excluded.some((item) => item.trim().toLowerCase() === projectKey);
}

/**
 * Remove events whose client/project is in the excluded list.
 * Events without a client are treated as "Sin proyecto".
 *
 * @param events - Calendar events to filter
 * @param excludedProjects - Excluded project names (case-insensitive)
 */
export function filterEventsByExcludedProjects(
  events: CalendarEvent[],
  excludedProjects: string[]
): CalendarEvent[] {
  if (excludedProjects.length === 0) {
    return events;
  }

  return events.filter((event) => {
    const project =
      extractClientFromSummary(event.summary || "") ?? NO_PROJECT_LABEL;
    return !isProjectExcluded(project, excludedProjects);
  });
}

/**
 * Hours for a calendar event via formatEventDuration.totalHours.
 * Returns 0 when duration cannot be computed.
 *
 * @param event - Google Calendar event
 */
export function computeEventHours(event: CalendarEvent): number {
  const duration = formatEventDuration(event);
  return duration?.totalHours ?? 0;
}

/**
 * Aggregate event hours by client/project extracted from the summary.
 * Pure and testable; earnings use hourlyRate (default 0 when omitted).
 *
 * @param events - Calendar events to aggregate
 * @param hourlyRate - Rate used to fill earnings (hours * rate)
 */
export function aggregateHoursByProject(
  events: CalendarEvent[],
  hourlyRate = 0
): DigestProjectRow[] {
  const hoursByProject = new Map<string, number>();

  for (const event of events) {
    const hours = computeEventHours(event);
    if (hours <= 0) {
      continue;
    }

    const project =
      extractClientFromSummary(event.summary || "") ?? NO_PROJECT_LABEL;
    hoursByProject.set(project, (hoursByProject.get(project) ?? 0) + hours);
  }

  return Array.from(hoursByProject.entries())
    .map(([project, hours]) => ({
      project,
      hours,
      earnings: hours * hourlyRate,
    }))
    .sort((a, b) => b.hours - a.hours);
}

/**
 * Parse event start into the given zone (dateTime or all-day date).
 */
function getEventStartInZone(
  event: CalendarEvent,
  timeZone: string
): DateTime | null {
  if (event.start.dateTime) {
    const dt = DateTime.fromISO(event.start.dateTime).setZone(timeZone);
    return dt.isValid ? dt : null;
  }

  if (event.start.date) {
    const dt = DateTime.fromISO(event.start.date, { zone: timeZone });
    return dt.isValid ? dt : null;
  }

  return null;
}

/**
 * Whether the event starts in [timeMin, timeMax) in the given zone.
 */
function isEventStartInRange(
  event: CalendarEvent,
  timeMinIso: string,
  timeMaxIso: string,
  timeZone: string
): boolean {
  const start = getEventStartInZone(event, timeZone);
  if (!start) {
    return false;
  }

  const timeMin = DateTime.fromISO(timeMinIso, { zone: timeZone });
  const timeMax = DateTime.fromISO(timeMaxIso, { zone: timeZone });

  return start >= timeMin && start < timeMax;
}

/**
 * Sum totalHours across events.
 */
function sumEventHours(events: CalendarEvent[]): number {
  return events.reduce((total, event) => total + computeEventHours(event), 0);
}

/**
 * Build week + month-to-date digest totals for one user from Google Calendar.
 *
 * @param user - Digest-eligible user (hourly rate + Google tokens)
 */
export async function buildDigestForUser(
  user: WeeklyDigestUser
): Promise<WeeklyDigestResult> {
  const weekRange = getCurrentWeekMonFriRange();
  const monthRange = getMonthToDateThroughFridayRange();
  const hourlyRate = user.hourly_rate;

  const accessToken = await getValidAccessToken(user);

  // Union of week and MTD so Monday falling in the previous month is included.
  const fetchTimeMin =
    weekRange.timeMin < monthRange.timeMin
      ? weekRange.timeMin
      : monthRange.timeMin;
  const fetchTimeMax = weekRange.timeMax;

  const events = await fetchPrimaryCalendarEvents(
    accessToken,
    fetchTimeMin,
    fetchTimeMax
  );

  const weekEvents = filterEventsByExcludedProjects(
    events.filter((event) =>
      isEventStartInRange(
        event,
        weekRange.timeMin,
        weekRange.timeMax,
        DEFAULT_TIME_ZONE
      )
    ),
    user.excluded_projects
  );
  const monthEvents = filterEventsByExcludedProjects(
    events.filter((event) =>
      isEventStartInRange(
        event,
        monthRange.timeMin,
        monthRange.timeMax,
        DEFAULT_TIME_ZONE
      )
    ),
    user.excluded_projects
  );

  const weekHours = sumEventHours(weekEvents);
  const monthHours = sumEventHours(monthEvents);
  const projects = aggregateHoursByProject(monthEvents, hourlyRate);

  return {
    weekHours,
    weekEarnings: weekHours * hourlyRate,
    monthHours,
    monthEarnings: monthHours * hourlyRate,
    projects,
    weekLabel: weekRange.weekLabel,
    monthLabel: monthRange.monthLabel,
    hourlyRate,
  };
}
