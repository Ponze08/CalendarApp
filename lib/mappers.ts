import type {
  Activity,
  Category,
  HolidayVacation,
  RecurrenceRule,
  Reminder,
  Tag,
  UserSettings
} from "@prisma/client";
import type {
  ActivityDto,
  ActivityPriority,
  ActivityStatus,
  CalendarView,
  HolidayVacationDto,
  HolidayVacationType,
  RecurrenceFrequency,
  UserSettingsDto
} from "@/types/calendar";

export type ActivityRecord = Activity & {
  category: Category | null;
  reminders: Reminder[];
  recurrenceRule: RecurrenceRule | null;
  tags: Tag[];
};

export function toCategoryDto(category: Category) {
  return {
    id: category.id,
    name: category.name,
    color: category.color
  };
}

export function toActivityDto(activity: ActivityRecord): ActivityDto & { deletedOccurrence?: boolean } {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    location: activity.location,
    start: activity.start.toISOString(),
    end: activity.end.toISOString(),
    allDay: activity.allDay,
    categoryId: activity.categoryId,
    category: activity.category ? toCategoryDto(activity.category) : null,
    color: activity.color,
    status: activity.status as ActivityStatus,
    priority: activity.priority as ActivityPriority,
    tags: activity.tags.map((tag) => tag.name),
    notes: activity.notes,
    reminders: activity.reminders.map((reminder) => ({
      id: reminder.id,
      offsetMinutes: reminder.offsetMinutes,
      label: reminder.label,
      custom: reminder.custom
    })),
    recurrenceRule: activity.recurrenceRule
      ? {
          id: activity.recurrenceRule.id,
          frequency: activity.recurrenceRule.frequency as RecurrenceFrequency,
          interval: activity.recurrenceRule.interval,
          weekdays: activity.recurrenceRule.weekdays,
          monthDay: activity.recurrenceRule.monthDay,
          endType: activity.recurrenceRule.endType as "never" | "on_date" | "after_count",
          until: activity.recurrenceRule.until?.toISOString() ?? null,
          count: activity.recurrenceRule.count
        }
      : null,
    recurrenceParentId: activity.recurrenceParentId,
    recurrenceDate: activity.recurrenceDate?.toISOString() ?? null,
    deletedOccurrence: activity.deletedOccurrence,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString()
  };
}

export function toHolidayVacationDto(entry: HolidayVacation): HolidayVacationDto {
  return {
    id: entry.id,
    name: entry.name,
    type: entry.type as HolidayVacationType,
    canton: entry.canton,
    country: entry.country,
    start: entry.start.toISOString(),
    end: entry.end.toISOString(),
    allDay: entry.allDay,
    source: entry.source,
    enabled: entry.enabled
  };
}

export function toSettingsDto(settings: UserSettings): UserSettingsDto {
  return {
    id: settings.id,
    timezone: settings.timezone,
    locale: settings.locale,
    workingDays: settings.workingDays
      .split(",")
      .map(Number)
      .filter((day) => day >= 1 && day <= 7),
    workingStart: settings.workingStart,
    workingEnd: settings.workingEnd,
    defaultView: settings.defaultView as CalendarView,
    theme: settings.theme as "light" | "dark" | "system",
    showHolidays: settings.showHolidays,
    showSchoolVacations: settings.showSchoolVacations,
    excludeHolidays: settings.excludeHolidays,
    excludeVacations: settings.excludeVacations,
    browserNotifications: settings.browserNotifications
  };
}
