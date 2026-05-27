import { addMilliseconds, isAfter, isBefore } from "date-fns";
import { RRule, Weekday } from "rrule";
import type { ActivityDto, RecurrenceFrequency } from "@/types/calendar";

type ExpandableActivity = ActivityDto;

const frequencyMap: Record<RecurrenceFrequency, RRule.Frequency> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY
};

const weekdayMap: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU
};

export function generateOccurrences(activity: ExpandableActivity, rangeStart: Date, rangeEnd: Date) {
  if (!activity.recurrenceRule) return [activity];

  const start = new Date(activity.start);
  const end = new Date(activity.end);
  const duration = end.getTime() - start.getTime();
  const rule = activity.recurrenceRule;
  const weekdays = rule.weekdays
    ? rule.weekdays
        .split(",")
        .map((day) => weekdayMap[day.trim()])
        .filter(Boolean)
    : undefined;

  const rrule = new RRule({
    freq: frequencyMap[rule.frequency],
    interval: rule.interval,
    dtstart: start,
    until: rule.endType === "on_date" && rule.until ? new Date(rule.until) : rangeEnd,
    count: rule.endType === "after_count" && rule.count ? rule.count : undefined,
    byweekday: weekdays,
    bymonthday: rule.monthDay ?? undefined
  });

  return rrule
    .between(rangeStart, rangeEnd, true)
    .map((occurrenceStart) => {
      const occurrenceEnd = addMilliseconds(occurrenceStart, duration);
      return {
        ...activity,
        id: `${activity.id}__${occurrenceStart.toISOString()}`,
        start: occurrenceStart.toISOString(),
        end: occurrenceEnd.toISOString(),
        seriesId: activity.id,
        recurrenceDate: occurrenceStart.toISOString(),
        isOccurrence: true
      };
    })
    .filter((occurrence) => isBefore(new Date(occurrence.start), rangeEnd) && isAfter(new Date(occurrence.end), rangeStart));
}

export function expandActivities(activities: ExpandableActivity[], rangeStart: Date, rangeEnd: Date) {
  const overridesByParentAndDate = new Set(
    activities
      .filter((activity) => activity.recurrenceParentId && activity.recurrenceDate)
      .map((activity) => `${activity.recurrenceParentId}:${activity.recurrenceDate}`)
  );

  const expanded: ActivityDto[] = [];
  for (const activity of activities) {
    if (activity.recurrenceParentId) {
      if (!("deletedOccurrence" in activity && activity.deletedOccurrence)) {
        expanded.push(activity);
      }
      continue;
    }

    if (!activity.recurrenceRule) {
      expanded.push(activity);
      continue;
    }

    const occurrences = generateOccurrences(activity, rangeStart, rangeEnd).filter((occurrence) => {
      const key = `${activity.id}:${occurrence.recurrenceDate}`;
      return !overridesByParentAndDate.has(key);
    });
    expanded.push(...occurrences);
  }

  return expanded.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
