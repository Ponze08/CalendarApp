import { addMilliseconds, subMilliseconds } from "date-fns";
import { db } from "@/lib/db";
import { expandActivities } from "@/lib/recurrence";
import { toActivityDto, type ActivityRecord } from "@/lib/mappers";
import { compactStringList } from "@/lib/utils";
import { activityInputSchema, type ActivityInput } from "@/lib/validation";
import type { ActivityDto, RecurrenceFrequency } from "@/types/calendar";

const activityInclude = {
  category: true,
  tags: true,
  reminders: true,
  recurrenceRule: true
} as const;

export type ActivityFilters = {
  start: Date;
  end: Date;
  search?: string;
  categoryIds?: string[];
  statuses?: string[];
  priorities?: string[];
  tags?: string[];
};

export async function listActivities(filters: ActivityFilters) {
  const activities = await db.activity.findMany({
    where: {
      AND: [
        {
          OR: [
            { start: { lt: filters.end }, end: { gt: filters.start } },
            { recurrenceRule: { isNot: null }, start: { lte: filters.end } },
            { recurrenceParentId: { not: null }, start: { lt: filters.end }, end: { gt: filters.start } }
          ]
        },
        ...(filters.search
          ? [
              {
                OR: [
                  { title: { contains: filters.search } },
                  { description: { contains: filters.search } },
                  { location: { contains: filters.search } },
                  { notes: { contains: filters.search } }
                ]
              }
            ]
          : [])
      ],
      ...(filters.categoryIds?.length ? { categoryId: { in: filters.categoryIds } } : {}),
      ...(filters.statuses?.length ? { status: { in: filters.statuses } } : {}),
      ...(filters.priorities?.length ? { priority: { in: filters.priorities } } : {}),
      ...(filters.tags?.length
        ? {
            tags: {
              some: {
                name: { in: filters.tags }
              }
            }
          }
        : {})
    },
    include: activityInclude,
    orderBy: { start: "asc" }
  });

  return expandActivities(
    activities.map((activity) => toActivityDto(activity as ActivityRecord)),
    filters.start,
    filters.end
  ).filter((activity) => !("deletedOccurrence" in activity && activity.deletedOccurrence));
}

export async function getActivity(id: string) {
  const activity = await db.activity.findUnique({ where: { id }, include: activityInclude });
  return activity ? toActivityDto(activity as ActivityRecord) : null;
}

export async function createActivity(input: ActivityInput) {
  const data = activityInputSchema.parse(input);
  const activity = await db.activity.create({
    data: activityCreateData(data),
    include: activityInclude
  });
  return toActivityDto(activity as ActivityRecord);
}

export async function updateActivity(id: string, input: ActivityInput) {
  const data = activityInputSchema.parse(input);
  if (data.seriesId && data.recurrenceDate && data.recurrenceScope === "only_this") {
    return upsertOccurrenceOverride(data.seriesId, data.recurrenceDate, data);
  }
  if (data.seriesId && data.recurrenceDate && data.recurrenceScope === "this_and_future") {
    return splitFutureSeries(data.seriesId, data.recurrenceDate, data);
  }

  const targetId = data.seriesId && data.recurrenceScope === "entire_series" ? data.seriesId : id;
  await db.activity.update({
    where: { id: targetId },
    data: activityUpdateData(data)
  });
  await replaceRecurrence(targetId, data);
  const updated = await getActivity(targetId);
  if (!updated) throw new Error("Activity not found after update.");
  return updated;
}

export async function deleteActivity(
  id: string,
  options?: { seriesId?: string | null; recurrenceDate?: string | null; scope?: "only_this" | "this_and_future" | "entire_series" }
) {
  if (options?.seriesId && options.recurrenceDate && options.scope === "only_this") {
    await createDeletedOccurrence(options.seriesId, new Date(options.recurrenceDate));
    return { ok: true };
  }
  if (options?.seriesId && options.recurrenceDate && options.scope === "this_and_future") {
    await db.recurrenceRule.update({
      where: { activityId: options.seriesId },
      data: {
        endType: "on_date",
        until: subMilliseconds(new Date(options.recurrenceDate), 1),
        count: null
      }
    });
    return { ok: true };
  }

  const targetId = options?.seriesId && options.scope === "entire_series" ? options.seriesId : id;
  await db.activity.delete({ where: { id: targetId } });
  return { ok: true };
}

export async function duplicateActivity(id: string) {
  const activity = await db.activity.findUnique({ where: { id }, include: activityInclude });
  if (!activity) throw new Error("Activity not found.");
  const dto = toActivityDto(activity as ActivityRecord);
  const copy = await createActivity({
    title: `${dto.title} (copy)`,
    description: dto.description,
    location: dto.location,
    start: new Date(dto.start),
    end: new Date(dto.end),
    allDay: dto.allDay,
    categoryId: dto.categoryId,
    color: dto.color,
    status: dto.status,
    priority: dto.priority,
    tags: dto.tags,
    notes: dto.notes,
    reminders: dto.reminders,
    recurrenceRule: dto.recurrenceRule
      ? {
          frequency: dto.recurrenceRule.frequency,
          interval: dto.recurrenceRule.interval,
          weekdays: dto.recurrenceRule.weekdays,
          monthDay: dto.recurrenceRule.monthDay,
          endType: dto.recurrenceRule.endType,
          until: dto.recurrenceRule.until ? new Date(dto.recurrenceRule.until) : null,
          count: dto.recurrenceRule.count
        }
      : null
  });
  return copy;
}

function tagConnectOrCreate(tags: string[]) {
  return compactStringList(tags).map((name) => ({
    where: { name },
    create: { name }
  }));
}

function activityCreateData(data: ActivityInput) {
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    start: data.start,
    end: data.end,
    allDay: data.allDay,
    categoryId: data.categoryId || null,
    color: data.color,
    status: data.status,
    priority: data.priority,
    notes: data.notes,
    tags: { connectOrCreate: tagConnectOrCreate(data.tags) },
    reminders: {
      create: data.reminders.map((reminder) => ({
        offsetMinutes: reminder.offsetMinutes,
        label: reminder.label,
        custom: reminder.custom
      }))
    },
    recurrenceRule: data.recurrenceRule
      ? {
          create: {
            frequency: data.recurrenceRule.frequency,
            interval: data.recurrenceRule.interval,
            weekdays: data.recurrenceRule.weekdays,
            monthDay: data.recurrenceRule.monthDay,
            endType: data.recurrenceRule.endType,
            until: data.recurrenceRule.until,
            count: data.recurrenceRule.count
          }
        }
      : undefined
  };
}

function activityUpdateData(data: ActivityInput) {
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    start: data.start,
    end: data.end,
    allDay: data.allDay,
    categoryId: data.categoryId || null,
    color: data.color,
    status: data.status,
    priority: data.priority,
    notes: data.notes,
    tags: {
      set: [],
      connectOrCreate: tagConnectOrCreate(data.tags)
    },
    reminders: {
      deleteMany: {},
      create: data.reminders.map((reminder) => ({
        offsetMinutes: reminder.offsetMinutes,
        label: reminder.label,
        custom: reminder.custom
      }))
    }
  };
}

async function replaceRecurrence(activityId: string, data: ActivityInput) {
  if (!data.recurrenceRule) {
    await db.recurrenceRule.deleteMany({ where: { activityId } });
    return;
  }
  await db.recurrenceRule.upsert({
    where: { activityId },
    update: {
      frequency: data.recurrenceRule.frequency,
      interval: data.recurrenceRule.interval,
      weekdays: data.recurrenceRule.weekdays,
      monthDay: data.recurrenceRule.monthDay,
      endType: data.recurrenceRule.endType,
      until: data.recurrenceRule.until,
      count: data.recurrenceRule.count
    },
    create: {
      activityId,
      frequency: data.recurrenceRule.frequency,
      interval: data.recurrenceRule.interval,
      weekdays: data.recurrenceRule.weekdays,
      monthDay: data.recurrenceRule.monthDay,
      endType: data.recurrenceRule.endType,
      until: data.recurrenceRule.until,
      count: data.recurrenceRule.count
    }
  });
}

async function upsertOccurrenceOverride(seriesId: string, recurrenceDate: Date, data: ActivityInput) {
  const existing = await db.activity.findFirst({
    where: { recurrenceParentId: seriesId, recurrenceDate },
    include: activityInclude
  });

  if (existing) {
    await db.activity.update({
      where: { id: existing.id },
      data: { ...activityUpdateData(data), recurrenceParentId: seriesId, recurrenceDate }
    });
    const updated = await getActivity(existing.id);
    if (!updated) throw new Error("Override not found after update.");
    return updated;
  }

  const created = await db.activity.create({
    data: {
      ...activityCreateData({ ...data, recurrenceRule: null }),
      recurrenceParentId: seriesId,
      recurrenceDate
    },
    include: activityInclude
  });
  return toActivityDto(created as ActivityRecord);
}

async function splitFutureSeries(seriesId: string, recurrenceDate: Date, data: ActivityInput) {
  const master = await db.activity.findUnique({ where: { id: seriesId }, include: activityInclude });
  if (!master?.recurrenceRule) throw new Error("Recurring series not found.");

  await db.recurrenceRule.update({
    where: { activityId: seriesId },
    data: {
      endType: "on_date",
      until: subMilliseconds(recurrenceDate, 1),
      count: null
    }
  });

  return createActivity({
    ...data,
    recurrenceRule: data.recurrenceRule ?? {
      frequency: master.recurrenceRule.frequency as RecurrenceFrequency,
      interval: master.recurrenceRule.interval,
      weekdays: master.recurrenceRule.weekdays,
      monthDay: master.recurrenceRule.monthDay,
      endType: master.recurrenceRule.endType as "never" | "on_date" | "after_count",
      until: master.recurrenceRule.until,
      count: master.recurrenceRule.count
    }
  });
}

async function createDeletedOccurrence(seriesId: string, recurrenceDate: Date) {
  const master = await db.activity.findUnique({ where: { id: seriesId }, include: activityInclude });
  if (!master) throw new Error("Recurring series not found.");
  const start = recurrenceDate;
  const end = addMilliseconds(start, master.end.getTime() - master.start.getTime());

  await db.activity.upsert({
    where: { id: `${seriesId}-${recurrenceDate.getTime()}` },
    update: { deletedOccurrence: true },
    create: {
      id: `${seriesId}-${recurrenceDate.getTime()}`,
      title: master.title,
      description: master.description,
      location: master.location,
      start,
      end,
      allDay: master.allDay,
      categoryId: master.categoryId,
      color: master.color,
      status: "cancelled",
      priority: master.priority,
      notes: master.notes,
      recurrenceParentId: seriesId,
      recurrenceDate,
      deletedOccurrence: true
    }
  });
}
