"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bell } from "lucide-react";
import { formatZurichDateTime } from "@/lib/dates";
import type { ActivityDto, UserSettingsDto } from "@/types/calendar";
import { Button } from "@/components/ui/button";

export function RemindersWidget({
  activities,
  settings,
  onEnableNotifications
}: {
  activities: ActivityDto[];
  settings: UserSettingsDto | null;
  onEnableNotifications: () => void;
}) {
  const notified = useRef(new Set<string>());
  const upcoming = useMemo(() => {
    const now = Date.now();
    const horizon = now + 24 * 60 * 60 * 1000;
    return activities
      .flatMap((activity) =>
        activity.reminders.map((reminder) => ({
          id: `${activity.id}-${reminder.offsetMinutes}`,
          title: activity.title,
          dueAt: new Date(new Date(activity.start).getTime() - reminder.offsetMinutes * 60_000),
          activity
        }))
      )
      .filter((reminder) => reminder.dueAt.getTime() >= now - 60_000 && reminder.dueAt.getTime() <= horizon)
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, 5);
  }, [activities]);

  useEffect(() => {
    if (!settings?.browserNotifications || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    const timer = window.setInterval(() => {
      const now = Date.now();
      for (const reminder of upcoming) {
        if (reminder.dueAt.getTime() <= now && !notified.current.has(reminder.id)) {
          notified.current.add(reminder.id);
          new Notification(reminder.title, {
            body: `Starts ${formatZurichDateTime(reminder.activity.start)}`
          });
        }
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [settings?.browserNotifications, upcoming]);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-primary" />
          Upcoming reminders
        </h2>
        <Button type="button" size="sm" variant="ghost" onClick={onEnableNotifications}>
          Enable
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {upcoming.length ? (
          upcoming.map((reminder) => (
            <div key={reminder.id} className="rounded-md bg-muted px-3 py-2 text-sm">
              <p className="font-medium">{reminder.title}</p>
              <p className="text-xs text-muted-foreground">{formatZurichDateTime(reminder.dueAt)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No reminders in the next 24 hours.</p>
        )}
      </div>
    </div>
  );
}
