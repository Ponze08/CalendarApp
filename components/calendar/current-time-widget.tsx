"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import {
  formatZurichDate,
  formatZurichTime,
  getZurichTimeZoneAbbreviation,
  getWeekday
} from "@/lib/dates";
import { classifyBusinessDay } from "@/lib/holidays";
import type { HolidayVacationDto } from "@/types/calendar";

export function CurrentTimeWidget({ holidays }: { holidays: HolidayVacationDto[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const businessDay = useMemo(() => classifyBusinessDay(now, holidays), [holidays, now]);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Europe/Zurich</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatZurichTime(now, "Europe/Zurich")}</p>
        </div>
        <Clock3 className="h-8 w-8 text-primary" />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p>{formatZurichDate(now)}</p>
        <p className="text-muted-foreground">
          {getWeekday(now)} · {getZurichTimeZoneAbbreviation(now)}
        </p>
      </div>
      <div className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        <span className="font-semibold">{businessDay.label}</span>
        <span className="block text-xs opacity-80">{businessDay.detail}</span>
      </div>
    </div>
  );
}
