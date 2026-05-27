import { z } from "zod";
import {
  activityPriorities,
  activityStatuses,
  calendarViews,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE
} from "@/lib/constants";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const dateValue = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return value;
}, z.date({ message: "Enter a valid date." }));

export const recurrenceRuleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.coerce.number().int().min(1).max(24).default(1),
    weekdays: z.string().trim().optional().nullable(),
    monthDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
    endType: z.enum(["never", "on_date", "after_count"]).default("never"),
    until: dateValue.optional().nullable(),
    count: z.coerce.number().int().min(1).max(999).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.endType === "on_date" && !value.until) {
      ctx.addIssue({
        code: "custom",
        path: ["until"],
        message: "Choose an end date for this recurrence."
      });
    }
    if (value.endType === "after_count" && !value.count) {
      ctx.addIssue({
        code: "custom",
        path: ["count"],
        message: "Enter the number of occurrences."
      });
    }
    if (value.frequency === "weekly" && value.weekdays) {
      const invalid = value.weekdays
        .split(",")
        .map((day) => day.trim())
        .some((day) => !["MO", "TU", "WE", "TH", "FR", "SA", "SU"].includes(day));
      if (invalid) {
        ctx.addIssue({
          code: "custom",
          path: ["weekdays"],
          message: "Weekly recurrence weekdays must use MO,TU,WE,TH,FR,SA,SU."
        });
      }
    }
  });

export const reminderSchema = z.object({
  offsetMinutes: z.coerce.number().int().min(0).max(10080),
  label: z.string().trim().min(1),
  custom: z.coerce.boolean().default(false)
});

export const activityInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: optionalText,
    location: optionalText,
    start: dateValue,
    end: dateValue,
    allDay: z.coerce.boolean().default(false),
    categoryId: z.string().trim().optional().nullable(),
    color: z.string().trim().min(4).default("#2563eb"),
    status: z.enum(activityStatuses).default("confirmed"),
    priority: z.enum(activityPriorities).default("medium"),
    tags: z.array(z.string().trim().min(1)).default([]),
    notes: optionalText,
    reminders: z.array(reminderSchema).default([]),
    recurrenceRule: recurrenceRuleSchema.optional().nullable(),
    recurrenceScope: z.enum(["only_this", "this_and_future", "entire_series"]).optional(),
    recurrenceDate: dateValue.optional().nullable(),
    seriesId: z.string().trim().optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (!value.allDay && value.end <= value.start) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End date and time must be after the start date and time."
      });
    }
    if (value.allDay && value.end < value.start) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End date must not be before the start date."
      });
    }
  });

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  color: z.string().trim().min(4, "Choose a valid color.")
});

export const holidayVacationInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    type: z.enum([
      "national_holiday",
      "cantonal_holiday",
      "school_vacation",
      "custom_vacation"
    ]),
    canton: z.string().trim().default("TI"),
    country: z.string().trim().default("CH"),
    start: dateValue,
    end: dateValue,
    allDay: z.coerce.boolean().default(true),
    source: z.string().trim().min(1).default("User"),
    enabled: z.coerce.boolean().default(true)
  })
  .refine((value) => value.end >= value.start, {
    path: ["end"],
    message: "End date must not be before start date."
  });

export const settingsInputSchema = z.object({
  timezone: z.string().trim().min(1).default(DEFAULT_TIMEZONE),
  locale: z.string().trim().min(1).default(DEFAULT_LOCALE),
  workingDays: z.array(z.coerce.number().int().min(1).max(7)).default([1, 2, 3, 4, 5]),
  workingStart: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
  workingEnd: z.string().regex(/^\d{2}:\d{2}$/).default("18:00"),
  defaultView: z.enum(calendarViews).default("timeGridWeek"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  showHolidays: z.coerce.boolean().default(true),
  showSchoolVacations: z.coerce.boolean().default(true),
  excludeHolidays: z.coerce.boolean().default(true),
  excludeVacations: z.coerce.boolean().default(true),
  browserNotifications: z.coerce.boolean().default(false)
});

export const availabilityQuerySchema = z
  .object({
    durationMinutes: z.coerce.number().int().min(5).max(720),
    start: dateValue,
    end: dateValue,
    workingHoursOnly: z.coerce.boolean().default(true),
    excludeHolidays: z.coerce.boolean().default(true),
    excludeVacations: z.coerce.boolean().default(true)
  })
  .refine((value) => value.end > value.start, {
    path: ["end"],
    message: "Date range end must be after start."
  });

export type ActivityInput = z.infer<typeof activityInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type HolidayVacationInput = z.infer<typeof holidayVacationInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
