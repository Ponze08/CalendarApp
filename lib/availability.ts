import { addDays, differenceInMinutes, isBefore, max, min, startOfDay } from "date-fns";
import {
  combineDateAndTime,
  durationLabel,
  formatZurichDateTime,
  overlaps,
  parseDate
} from "@/lib/dates";
import { holidayVacationOverlaps } from "@/lib/holidays";
import type { ActivityDto, FreeSlot, HolidayVacationDto } from "@/types/calendar";

export type AvailabilityOptions = {
  durationMinutes: number;
  rangeStart: Date;
  rangeEnd: Date;
  workingDays: number[];
  workingStart: string;
  workingEnd: string;
  workingHoursOnly: boolean;
  excludeHolidays: boolean;
  excludeVacations: boolean;
  holidays: HolidayVacationDto[];
};

type BusyRange = {
  start: Date;
  end: Date;
};

function mergeBusyRanges(ranges: BusyRange[]) {
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: BusyRange[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (!last || range.start > last.end) {
      merged.push({ ...range });
    } else if (range.end > last.end) {
      last.end = range.end;
    }
  }
  return merged;
}

export function findFreeSlots(activities: ActivityDto[], options: AvailabilityOptions): FreeSlot[] {
  const slots: FreeSlot[] = [];
  let day = startOfDay(options.rangeStart);

  while (day < options.rangeEnd) {
    const isoWeekday = day.getDay() === 0 ? 7 : day.getDay();
    const dayEnd = addDays(day, 1);

    if (options.workingHoursOnly && !options.workingDays.includes(isoWeekday)) {
      day = dayEnd;
      continue;
    }

    const windowStart = options.workingHoursOnly
      ? max([combineDateAndTime(day, options.workingStart), options.rangeStart])
      : max([day, options.rangeStart]);
    const windowEnd = options.workingHoursOnly
      ? min([combineDateAndTime(day, options.workingEnd), options.rangeEnd])
      : min([dayEnd, options.rangeEnd]);

    if (!isBefore(windowStart, windowEnd)) {
      day = dayEnd;
      continue;
    }

    const excludedTypes = [
      ...(options.excludeHolidays ? (["national_holiday", "cantonal_holiday"] as const) : []),
      ...(options.excludeVacations ? (["school_vacation", "custom_vacation"] as const) : [])
    ];

    if (
      excludedTypes.length > 0 &&
      holidayVacationOverlaps(options.holidays, windowStart, windowEnd, [...excludedTypes])
    ) {
      day = dayEnd;
      continue;
    }

    const busy = mergeBusyRanges(
      activities
        .filter((activity) => activity.status !== "cancelled")
        .map((activity) => ({ start: parseDate(activity.start), end: parseDate(activity.end) }))
        .filter((activity) => overlaps(activity.start, activity.end, windowStart, windowEnd))
        .map((activity) => ({
          start: max([activity.start, windowStart]),
          end: min([activity.end, windowEnd])
        }))
    );

    let cursor = windowStart;
    for (const range of busy) {
      if (differenceInMinutes(range.start, cursor) >= options.durationMinutes) {
        slots.push(toFreeSlot(cursor, range.start));
      }
      if (range.end > cursor) cursor = range.end;
    }

    if (differenceInMinutes(windowEnd, cursor) >= options.durationMinutes) {
      slots.push(toFreeSlot(cursor, windowEnd));
    }

    day = dayEnd;
  }

  return slots;
}

function toFreeSlot(start: Date, end: Date): FreeSlot {
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    durationMinutes: differenceInMinutes(end, start),
    label: `${formatZurichDateTime(start)} - ${formatZurichDateTime(end, "HH:mm")} (${durationLabel(start, end)})`
  };
}
