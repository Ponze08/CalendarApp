"use client";

import Link from "next/link";
import { CalendarPlus, Download, Moon, Search, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { activityStatuses } from "@/lib/constants";
import { toDateInputValue } from "@/lib/dates";
import { titleCase } from "@/lib/utils";
import type { ActivityDto, CategoryDto, FreeSlot, HolidayVacationDto, UserSettingsDto } from "@/types/calendar";
import { AvailabilityPanel } from "@/components/calendar/availability-panel";
import { CurrentTimeWidget } from "@/components/calendar/current-time-widget";
import { RemindersWidget } from "@/components/calendar/reminders-widget";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type CalendarFilters = {
  search: string;
  categoryIds: string[];
  statuses: string[];
  showHolidays: boolean;
  showVacations: boolean;
};

type Props = {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  categories: CategoryDto[];
  activities: ActivityDto[];
  holidays: HolidayVacationDto[];
  settings: UserSettingsDto | null;
  visibleRange: { start: string; end: string } | null;
  onCreate: () => void;
  onDateNavigate: (date: string) => void;
  onCreateFromSlot: (slot: FreeSlot) => void;
  onEnableNotifications: () => void;
};

export function Sidebar({
  filters,
  onFiltersChange,
  categories,
  activities,
  holidays,
  settings,
  visibleRange,
  onCreate,
  onDateNavigate,
  onCreateFromSlot,
  onEnableNotifications
}: Props) {
  const { theme, setTheme } = useTheme();

  function toggleCategory(id: string, checked: boolean) {
    onFiltersChange({
      ...filters,
      categoryIds: checked
        ? [...filters.categoryIds, id]
        : filters.categoryIds.filter((categoryId) => categoryId !== id)
    });
  }

  function toggleStatus(status: string, checked: boolean) {
    onFiltersChange({
      ...filters,
      statuses: checked
        ? [...filters.statuses, status]
        : filters.statuses.filter((current) => current !== status)
    });
  }

  const exportStart = visibleRange?.start ?? new Date().toISOString();
  const exportEnd = visibleRange?.end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto border-r bg-background p-4 lg:w-80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Ticino</p>
          <h1 className="text-xl font-semibold">Calendar</h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
      </div>

      <Button type="button" onClick={onCreate}>
        <CalendarPlus className="h-4 w-4" />
        Create activity
      </Button>

      <CurrentTimeWidget holidays={holidays} />

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <Label htmlFor="date-nav">Mini calendar</Label>
        <Input
          id="date-nav"
          className="mt-2"
          type="date"
          defaultValue={toDateInputValue(new Date())}
          onChange={(event) => onDateNavigate(event.target.value)}
        />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <Label htmlFor="activity-search" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </Label>
        <Input
          id="activity-search"
          className="mt-2"
          value={filters.search}
          placeholder="Title, location, notes"
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Calendar layers</h2>
        <div className="mt-3 space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            Holidays
            <Switch
              checked={filters.showHolidays}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showHolidays: checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            School vacations
            <Switch
              checked={filters.showVacations}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showVacations: checked })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Categories</h2>
        <div className="mt-3 space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.categoryIds.includes(category.id)}
                onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
              />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Status</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {activityStatuses.map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.statuses.includes(status)}
                onCheckedChange={(checked) => toggleStatus(status, checked === true)}
              />
              {titleCase(status)}
            </label>
          ))}
        </div>
      </section>

      <AvailabilityPanel onCreateFromSlot={onCreateFromSlot} />
      <RemindersWidget
        activities={activities}
        settings={settings}
        onEnableNotifications={onEnableNotifications}
      />

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Data</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export?format=json&start=${encodeURIComponent(exportStart)}&end=${encodeURIComponent(exportEnd)}`}>
              <Download className="h-4 w-4" />
              JSON
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export?format=ics&start=${encodeURIComponent(exportStart)}&end=${encodeURIComponent(exportEnd)}`}>
              <Download className="h-4 w-4" />
              ICS
            </a>
          </Button>
        </div>
      </section>

      <Button asChild variant="ghost" className="justify-start">
        <Link href="/settings">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </Button>
    </aside>
  );
}
