"use client";

import { CalendarEvent } from "@/features/welcome/types/apiTypesCalendar";
import {
  extractClientFromSummary,
  formatEventDuration,
  formatEventTimeRange,
  groupEventsByDayArray,
} from "@/shared/utils/googleCalendarEvents";
import { useQuery } from "@tanstack/react-query";

export interface ProcessedEvent {
  id: string;
  summary: string;
  startTime: string;
  endTime: string;
  client: string | null;
  duration: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

export interface EventDay {
  date: string;
  dateFormatted: string;
  events: ProcessedEvent[];
}

interface UseEventsByGoogleParams {
  timeMin: string;
  timeMax: string;
  maxResults?: number;
  timeZone?: string;
}

/**
 * Hook to fetch and process Google Calendar events
 * Uses React Query select to process data efficiently
 *
 * @param params - Date range and query parameters
 * @returns Processed events grouped by day with loading and error states
 */
export function useEventsByGoogle(params: UseEventsByGoogleParams): {
  eventsByDay: EventDay[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const {
    timeMin,
    timeMax,
    maxResults = 50,
    timeZone = "Europe/Madrid",
  } = params;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["googleCalendarEvents", maxResults, timeMin, timeMax],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (maxResults) queryParams.set("maxResults", String(maxResults));
      queryParams.set("timeMin", timeMin);
      queryParams.set("timeMax", timeMax);

      const response = await fetch(
        `/api/calendar/events?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (events: CalendarEvent[]) => {
      // Group events by day first
      const grouped = groupEventsByDayArray(events, timeZone);

      // Process events and map to processed format
      return grouped.map(({ date, dateFormatted, events: dayEvents }) => ({
        date,
        dateFormatted,
        events: dayEvents.map((event) => {
          const duration = formatEventDuration(event);
          const timeRange = formatEventTimeRange(event, timeZone);
          const [startTime, endTime] = timeRange.includes(" - ")
            ? timeRange.split(" - ")
            : [timeRange, ""];
          const client = extractClientFromSummary(event.summary || "");

          return {
            id: event.id,
            summary: event.summary || "Sin título",
            startTime,
            endTime,
            client,
            duration: duration
              ? {
                  hours: duration.hours,
                  minutes: duration.minutes,
                  seconds: duration.seconds,
                }
              : null,
          };
        }),
      }));
    },
  });

  return {
    eventsByDay: data || [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
