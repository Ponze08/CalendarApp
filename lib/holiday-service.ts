import { db } from "@/lib/db";
import { overlaps, parseDate } from "@/lib/dates";
import { toHolidayVacationDto } from "@/lib/mappers";
import {
  holidayVacationInputSchema,
  type HolidayVacationInput
} from "@/lib/validation";

export async function listHolidayVacations(start?: Date, end?: Date, enabledOnly = false) {
  const entries = await db.holidayVacation.findMany({
    where: {
      ...(enabledOnly ? { enabled: true } : {}),
      ...(start && end ? { start: { lte: end }, end: { gte: start } } : {})
    },
    orderBy: [{ start: "asc" }, { name: "asc" }]
  });
  return entries.map(toHolidayVacationDto);
}

export async function createHolidayVacation(input: HolidayVacationInput) {
  const data = holidayVacationInputSchema.parse(input);
  const entry = await db.holidayVacation.create({ data });
  return toHolidayVacationDto(entry);
}

export async function updateHolidayVacation(id: string, input: HolidayVacationInput) {
  const data = holidayVacationInputSchema.parse(input);
  const entry = await db.holidayVacation.update({ where: { id }, data });
  return toHolidayVacationDto(entry);
}

export async function deleteHolidayVacation(id: string) {
  await db.holidayVacation.delete({ where: { id } });
  return { ok: true };
}

export async function importHolidayVacations(entries: HolidayVacationInput[]) {
  const parsed = entries.map((entry) => holidayVacationInputSchema.parse(entry));
  await db.holidayVacation.createMany({ data: parsed });
  return { imported: parsed.length };
}

export function hasHolidayVacationOverlap(
  entries: Awaited<ReturnType<typeof listHolidayVacations>>,
  start: Date | string,
  end: Date | string
) {
  const parsedStart = parseDate(start);
  const parsedEnd = parseDate(end);
  return entries.some((entry) => entry.enabled && overlaps(parseDate(entry.start), parseDate(entry.end), parsedStart, parsedEnd));
}
