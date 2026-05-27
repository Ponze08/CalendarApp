import { db } from "@/lib/db";
import { toSettingsDto } from "@/lib/mappers";
import { settingsInputSchema, type SettingsInput } from "@/lib/validation";

export async function getSettings() {
  const settings = await db.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" }
  });
  return toSettingsDto(settings);
}

export async function updateSettings(input: SettingsInput) {
  const data = settingsInputSchema.parse(input);
  const settings = await db.userSettings.upsert({
    where: { id: "default" },
    update: {
      timezone: data.timezone,
      locale: data.locale,
      workingDays: data.workingDays.join(","),
      workingStart: data.workingStart,
      workingEnd: data.workingEnd,
      defaultView: data.defaultView,
      theme: data.theme,
      showHolidays: data.showHolidays,
      showSchoolVacations: data.showSchoolVacations,
      excludeHolidays: data.excludeHolidays,
      excludeVacations: data.excludeVacations,
      browserNotifications: data.browserNotifications
    },
    create: {
      id: "default",
      timezone: data.timezone,
      locale: data.locale,
      workingDays: data.workingDays.join(","),
      workingStart: data.workingStart,
      workingEnd: data.workingEnd,
      defaultView: data.defaultView,
      theme: data.theme,
      showHolidays: data.showHolidays,
      showSchoolVacations: data.showSchoolVacations,
      excludeHolidays: data.excludeHolidays,
      excludeVacations: data.excludeVacations,
      browserNotifications: data.browserNotifications
    }
  });
  return toSettingsDto(settings);
}
