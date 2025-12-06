/**
 * Calendar event from Google Calendar API
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
}

/**
 * Response from calendar events API
 */
export interface CalendarEventsResponse {
  data: CalendarEvent[];
  total?: number;
}

