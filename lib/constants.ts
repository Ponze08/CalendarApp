import type { ActivityPriority, ActivityStatus, CalendarView } from "@/types/calendar";

export const APP_NAME = "Ticino Calendar";
export const DEFAULT_TIMEZONE = "Europe/Zurich";
export const DEFAULT_LOCALE = "en-CH";

export const activityStatuses: ActivityStatus[] = [
  "confirmed",
  "tentative",
  "cancelled",
  "completed"
];

export const activityPriorities: ActivityPriority[] = ["low", "medium", "high", "urgent"];

export const calendarViews: CalendarView[] = [
  "dayGridMonth",
  "timeGridWeek",
  "timeGridDay",
  "listWeek"
];

export const defaultCategories = [
  { name: "Work", color: "#2563eb" },
  { name: "Personal", color: "#0f766e" },
  { name: "Family", color: "#c2410c" },
  { name: "Health", color: "#dc2626" },
  { name: "Travel", color: "#7c3aed" },
  { name: "Study", color: "#0891b2" },
  { name: "Holiday", color: "#059669" },
  { name: "Vacation", color: "#ca8a04" },
  { name: "Reminder", color: "#db2777" },
  { name: "Other", color: "#64748b" }
] as const;

export const reminderOptions = [
  { label: "None", offsetMinutes: Number.NaN },
  { label: "At event time", offsetMinutes: 0 },
  { label: "5 minutes before", offsetMinutes: 5 },
  { label: "15 minutes before", offsetMinutes: 15 },
  { label: "30 minutes before", offsetMinutes: 30 },
  { label: "1 hour before", offsetMinutes: 60 },
  { label: "1 day before", offsetMinutes: 1440 },
  { label: "Custom", offsetMinutes: -1 }
] as const;

export const translations = {
  en: {
    createActivity: "Create activity",
    editActivity: "Edit activity",
    deleteActivity: "Delete activity",
    duplicateActivity: "Duplicate activity",
    findFreeSlot: "Find free slot",
    holidaysVacations: "Holidays & vacations",
    settings: "Settings"
  },
  it: {
    createActivity: "Crea attivita",
    editActivity: "Modifica attivita",
    deleteActivity: "Elimina attivita",
    duplicateActivity: "Duplica attivita",
    findFreeSlot: "Trova spazio libero",
    holidaysVacations: "Festivi e vacanze",
    settings: "Impostazioni"
  }
} as const;
