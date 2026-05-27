import type { PrismaClient } from "@prisma/client";
import { defaultCategories } from "@/lib/constants";
import { seedDate, ticinoHolidayVacationSeed } from "@/lib/holiday-data";

export async function seedDefaultData(prisma: PrismaClient) {
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color },
      create: category
    });
  }

  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" }
  });

  for (const holiday of ticinoHolidayVacationSeed) {
    const start = seedDate(holiday.start);
    const end = seedDate(holiday.end, true);
    const existing = await prisma.holidayVacation.findFirst({
      where: { name: holiday.name, start, end, type: holiday.type }
    });
    if (!existing) {
      await prisma.holidayVacation.create({
        data: {
          name: holiday.name,
          type: holiday.type,
          canton: "TI",
          country: "CH",
          start,
          end,
          allDay: true,
          source: holiday.source,
          enabled: true
        }
      });
    }
  }

  const work = await prisma.category.findUnique({ where: { name: "Work" } });
  const personal = await prisma.category.findUnique({ where: { name: "Personal" } });

  if ((await prisma.activity.count()) === 0) {
    await prisma.activity.create({
      data: {
        title: "Team planning",
        description: "Weekly planning and priorities.",
        location: "Bellinzona office",
        start: new Date("2026-05-18T07:00:00.000Z"),
        end: new Date("2026-05-18T08:00:00.000Z"),
        allDay: false,
        color: work?.color ?? "#2563eb",
        status: "confirmed",
        priority: "high",
        categoryId: work?.id,
        tags: { connectOrCreate: [{ where: { name: "planning" }, create: { name: "planning" } }] },
        reminders: { create: [{ offsetMinutes: 15, label: "15 minutes before", custom: false }] },
        recurrenceRule: {
          create: {
            frequency: "weekly",
            interval: 1,
            weekdays: "MO",
            endType: "never"
          }
        }
      }
    });

    await prisma.activity.create({
      data: {
        title: "Dentist appointment",
        description: "Routine check-up.",
        location: "Lugano",
        start: new Date("2026-05-20T12:30:00.000Z"),
        end: new Date("2026-05-20T13:30:00.000Z"),
        allDay: false,
        color: personal?.color ?? "#0f766e",
        status: "tentative",
        priority: "medium",
        categoryId: personal?.id,
        tags: { connectOrCreate: [{ where: { name: "health" }, create: { name: "health" } }] },
        reminders: { create: [{ offsetMinutes: 60, label: "1 hour before", custom: false }] }
      }
    });
  }
}
