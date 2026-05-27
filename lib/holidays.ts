import { overlaps, parseDate } from "@/lib/dates";
import { seedDate, ticinoHolidayVacationSeed } from "@/lib/holiday-data";
import type { HolidayVacationDto, HolidayVacationType } from "@/types/calendar";

export interface HolidayProvider {
  load(start: Date, end: Date): Promise<Omit<HolidayVacationDto, "id">[]>;
}

export class LocalJsonHolidayProvider implements HolidayProvider {
  async load(start: Date, end: Date) {
    return ticinoHolidayVacationSeed
      .map((entry) => ({
        name: entry.name,
        type: entry.type,
        canton: "TI",
        country: "CH",
        start: seedDate(entry.start).toISOString(),
        end: seedDate(entry.end, true).toISOString(),
        allDay: true,
        source: entry.source,
        enabled: true
      }))
      .filter((entry) => overlaps(parseDate(entry.start), parseDate(entry.end), start, end));
  }
}

export class FutureApiHolidayProvider implements HolidayProvider {
  constructor(private readonly endpoint: string) {}

  async load(start: Date, end: Date) {
    const url = new URL(this.endpoint);
    url.searchParams.set("start", start.toISOString());
    url.searchParams.set("end", end.toISOString());
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Holiday API request failed.");
    }
    return (await response.json()) as Omit<HolidayVacationDto, "id">[];
  }
}

export function holidayVacationOverlaps(
  holidays: Pick<HolidayVacationDto, "start" | "end" | "enabled" | "type">[],
  start: Date,
  end: Date,
  types?: HolidayVacationType[]
) {
  return holidays.some((holiday) => {
    if (!holiday.enabled) return false;
    if (types && !types.includes(holiday.type)) return false;
    return overlaps(parseDate(holiday.start), parseDate(holiday.end), start, end);
  });
}

export function classifyBusinessDay(
  date: Date,
  holidays: Pick<HolidayVacationDto, "start" | "end" | "enabled" | "type" | "name">[]
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const match = holidays.find(
    (holiday) =>
      holiday.enabled && overlaps(parseDate(holiday.start), parseDate(holiday.end), dayStart, dayEnd)
  );

  if (match?.type === "school_vacation" || match?.type === "custom_vacation") {
    return { label: "Vacation period", detail: match.name };
  }
  if (match) {
    return { label: "Holiday in Ticino", detail: match.name };
  }

  const weekday = dayStart.getDay();
  if (weekday === 0 || weekday === 6) {
    return { label: "Weekend", detail: "Non-working day" };
  }

  return { label: "Business day", detail: "Ticino working day" };
}
