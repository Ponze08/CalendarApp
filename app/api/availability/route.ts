import { NextRequest } from "next/server";
import { listActivities } from "@/lib/activity-service";
import { findFreeSlots } from "@/lib/availability";
import { listHolidayVacations } from "@/lib/holiday-service";
import { jsonError, jsonOk } from "@/lib/http";
import { getSettings } from "@/lib/settings-service";
import { availabilityQuerySchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const query = availabilityQuerySchema.parse(await request.json());
    const [settings, activities, holidays] = await Promise.all([
      getSettings(),
      listActivities({ start: query.start, end: query.end }),
      listHolidayVacations(query.start, query.end, true)
    ]);
    const slots = findFreeSlots(activities, {
      durationMinutes: query.durationMinutes,
      rangeStart: query.start,
      rangeEnd: query.end,
      workingDays: settings.workingDays,
      workingStart: settings.workingStart,
      workingEnd: settings.workingEnd,
      workingHoursOnly: query.workingHoursOnly,
      excludeHolidays: query.excludeHolidays,
      excludeVacations: query.excludeVacations,
      holidays
    });
    return jsonOk({ slots });
  } catch (error) {
    return jsonError(error);
  }
}
