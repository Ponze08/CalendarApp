import { format } from "date-fns";
import type { ActivityDto } from "@/types/calendar";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function formatIcsDate(date: string, allDay: boolean) {
  const parsed = new Date(date);
  return allDay
    ? `;VALUE=DATE:${format(parsed, "yyyyMMdd")}`
    : `:${format(parsed, "yyyyMMdd'T'HHmmss'Z'")}`;
}

export function exportActivitiesToIcs(activities: ActivityDto[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ticino Calendar//EN",
    "CALSCALE:GREGORIAN"
  ];

  for (const activity of activities) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${activity.id}@ticino-calendar.local`);
    lines.push(`SUMMARY:${escapeIcs(activity.title)}`);
    if (activity.description) lines.push(`DESCRIPTION:${escapeIcs(activity.description)}`);
    if (activity.location) lines.push(`LOCATION:${escapeIcs(activity.location)}`);
    lines.push(`DTSTART${formatIcsDate(activity.start, activity.allDay)}`);
    lines.push(`DTEND${formatIcsDate(activity.end, activity.allDay)}`);
    lines.push(`STATUS:${activity.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`);
    lines.push(`CATEGORIES:${activity.tags.map(escapeIcs).join(",")}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function exportActivitiesToJson(activities: ActivityDto[]) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), activities }, null, 2);
}

export function parseJsonImport(text: string) {
  const parsed = JSON.parse(text) as { activities?: unknown[] };
  if (!Array.isArray(parsed.activities)) {
    throw new Error("JSON import must contain an activities array.");
  }
  return parsed.activities;
}

export function parseSimpleIcs(text: string) {
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  return blocks.map((block) => {
    const lines = block.split(/\r?\n/);
    const get = (prefix: string) =>
      lines.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim();
    const start = get("DTSTART:") ?? get("DTSTART;VALUE=DATE:");
    const end = get("DTEND:") ?? get("DTEND;VALUE=DATE:");
    const allDay = Boolean(get("DTSTART;VALUE=DATE:"));
    return {
      title: get("SUMMARY:") ?? "Imported activity",
      description: get("DESCRIPTION:") ?? null,
      location: get("LOCATION:") ?? null,
      start: parseIcsDate(start, allDay),
      end: parseIcsDate(end, allDay),
      allDay,
      color: "#2563eb",
      status: get("STATUS:") === "CANCELLED" ? "cancelled" : "confirmed",
      priority: "medium",
      tags: (get("CATEGORIES:") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: null,
      reminders: [],
      recurrenceRule: null
    };
  });
}

function parseIcsDate(value: string | undefined, allDay: boolean) {
  if (!value) return new Date().toISOString();
  if (allDay) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`).toISOString();
  }
  const normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  return new Date(normalized).toISOString();
}
