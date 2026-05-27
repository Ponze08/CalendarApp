export type ActivityStatus = "confirmed" | "tentative" | "cancelled" | "completed";
export type ActivityPriority = "low" | "medium" | "high" | "urgent";
export type HolidayVacationType =
  | "national_holiday"
  | "cantonal_holiday"
  | "school_vacation"
  | "custom_vacation";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceEndType = "never" | "on_date" | "after_count";
export type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

export type CategoryDto = {
  id: string;
  name: string;
  color: string;
};

export type ReminderDto = {
  id?: string;
  offsetMinutes: number;
  label: string;
  custom: boolean;
};

export type RecurrenceRuleDto = {
  id?: string;
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: string | null;
  monthDay?: number | null;
  endType: RecurrenceEndType;
  until?: string | null;
  count?: number | null;
};

export type ActivityDto = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  categoryId: string | null;
  category: CategoryDto | null;
  color: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  tags: string[];
  notes: string | null;
  reminders: ReminderDto[];
  recurrenceRule: RecurrenceRuleDto | null;
  recurrenceParentId?: string | null;
  recurrenceDate?: string | null;
  seriesId?: string | null;
  isOccurrence?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HolidayVacationDto = {
  id: string;
  name: string;
  type: HolidayVacationType;
  canton: "TI" | string;
  country: "CH" | string;
  start: string;
  end: string;
  allDay: boolean;
  source: string;
  enabled: boolean;
};

export type UserSettingsDto = {
  id: string;
  timezone: string;
  locale: string;
  workingDays: number[];
  workingStart: string;
  workingEnd: string;
  defaultView: CalendarView;
  theme: "light" | "dark" | "system";
  showHolidays: boolean;
  showSchoolVacations: boolean;
  excludeHolidays: boolean;
  excludeVacations: boolean;
  browserNotifications: boolean;
};

export type FreeSlot = {
  start: string;
  end: string;
  durationMinutes: number;
  label: string;
};

export type CalendarBootstrap = {
  categories: CategoryDto[];
  settings: UserSettingsDto;
};
