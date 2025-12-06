"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarEvent } from "@/features/welcome/types/apiTypesCalendar";

interface UseCalendarEventsParams {
  maxResults?: number;
  timeMin?: string;
}

/**
 * Hook to fetch calendar events from Google Calendar
 *
 * @param params - Query parameters (maxResults, timeMin)
 * @returns Calendar events, loading state, and error
 */
export function useCalendarEvents(params: UseCalendarEventsParams = {}) {
  const { maxResults = 10, timeMin } = params;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["calendarEvents", maxResults, timeMin],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (maxResults) queryParams.set("maxResults", String(maxResults));
      if (timeMin) queryParams.set("timeMin", timeMin);

      const response = await fetch(`/api/calendar/events?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      // Extract .data from response
      return json.data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    events: data || [],
    isLoading,
    isError,
    error,
  };
}

