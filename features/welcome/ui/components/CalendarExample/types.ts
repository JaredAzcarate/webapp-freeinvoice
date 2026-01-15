import { EventDay } from "@/shared/hooks/useEventsByGoogle";

export type TimeFilterType = "week" | "month" | "year";

export interface CalendarExampleProps {
  eventsByDay: EventDay[];
  timeFilter?: TimeFilterType;
  dateRange?: {
    timeMin: string;
    timeMax: string;
  };
}
