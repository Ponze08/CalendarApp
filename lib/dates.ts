import { addDays, differenceInMinutes, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from "@/lib/constants";

export function parseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }
  return date;
}

export function toIso(date: Date) {
  return date.toISOString();
}

export function formatZurichDateTime(
  date: Date | string,
  pattern = "EEE, dd.MM.yyyy HH:mm",
  timezone = DEFAULT_TIMEZONE
) {
  return formatInTimeZone(parseDate(date), timezone, pattern);
}

export function formatZurichDate(date: Date | string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(parseDate(date), timezone, "EEE, dd.MM.yyyy");
}

export function formatZurichTime(date: Date | string, timezone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(parseDate(date), timezone, "HH:mm");
}

export function getZurichTimeZoneAbbreviation(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIMEZONE,
    timeZoneName: "shortOffset",
    hour: "2-digit"
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+1";
  return offset.includes("+2") ? "CEST" : "CET";
}

export function getWeekday(date: Date | string, locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: timezone
  }).format(parseDate(date));
}

export function isWeekend(date: Date) {
  const day = Number(format(date, "i"));
  return day >= 6;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function allDayBounds(date: Date) {
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  };
}

export function toFullCalendarExclusiveEnd(end: string | Date, allDay: boolean) {
  const date = parseDate(end);
  return allDay ? addDays(startOfDay(date), 1).toISOString() : date.toISOString();
}

export function fromDateInput(value: string, end = false) {
  const date = new Date(`${value}T00:00:00.000`);
  return end ? endOfDay(date) : startOfDay(date);
}

export function toDateInputValue(value: Date | string) {
  return format(parseDate(value), "yyyy-MM-dd");
}

export function toDateTimeLocalValue(value: Date | string) {
  return format(parseDate(value), "yyyy-MM-dd'T'HH:mm");
}

export function durationLabel(start: Date | string, end: Date | string) {
  const minutes = differenceInMinutes(parseDate(end), parseDate(start));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

export function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function dayKey(date: Date | string) {
  return format(parseDate(date), "yyyy-MM-dd");
}

export function inclusiveAllDayEnd(date: Date) {
  return endOfDay(date);
}

export function eachLocalDay(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const final = startOfDay(end);
  while (cursor <= final) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function sameLocalDay(a: Date | string, b: Date | string) {
  return isSameDay(parseDate(a), parseDate(b));
}
