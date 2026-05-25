import { EventDay } from "@/shared/hooks/useEventsByGoogle";

export type TimeFilterType =
  | "week"
  | "month"
  | "year"
  | "yearMonth"
  | "custom";

export interface CalendarExampleProps {
  eventsByDay: EventDay[];
  timeFilter?: TimeFilterType;
  timeFilterLabel?: string;
  dateRange?: {
    timeMin: string;
    timeMax: string;
  };
}
