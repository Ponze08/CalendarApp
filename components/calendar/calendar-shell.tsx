"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { EventInput } from "@fullcalendar/core";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
import { toFullCalendarExclusiveEnd } from "@/lib/dates";
import type {
  ActivityDto,
  CalendarBootstrap,
  CalendarView,
  FreeSlot,
  HolidayVacationDto,
  UserSettingsDto
} from "@/types/calendar";
import { ActivityDetails } from "@/components/activities/activity-details";
import { ActivityDialog } from "@/components/activities/activity-dialog";
import { FullCalendarView, type CalendarHandle } from "@/components/calendar/full-calendar-view";
import { Sidebar, type CalendarFilters } from "@/components/calendar/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultFilters: CalendarFilters = {
  search: "",
  categoryIds: [],
  statuses: [],
  showHolidays: true,
  showVacations: true
};

export function CalendarShell() {
  const calendarRef = useRef<CalendarHandle | null>(null);
  const [bootstrap, setBootstrap] = useState<CalendarBootstrap | null>(null);
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayVacationDto[]>([]);
  const [visibleRange, setVisibleRange] = useState<{ start: string; end: string; title: string } | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>(defaultFilters);
  const [view, setView] = useState<CalendarView>("timeGridWeek");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDto | null>(null);
  const [initialRange, setInitialRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    if (!visibleRange) return;
    void loadRange();
  }, [visibleRange, filters.search, filters.categoryIds, filters.statuses]);

  async function loadBootstrap() {
    try {
      const data = await fetchJson<CalendarBootstrap>("/api/bootstrap");
      setBootstrap(data);
      setView(data.settings.defaultView);
      setFilters({
        ...defaultFilters,
        showHolidays: data.settings.showHolidays,
        showVacations: data.settings.showSchoolVacations
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load calendar.");
    }
  }

  const loadRange = useCallback(async () => {
    if (!visibleRange) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: visibleRange.start,
        end: visibleRange.end
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.categoryIds.length) params.set("categoryIds", filters.categoryIds.join(","));
      if (filters.statuses.length) params.set("statuses", filters.statuses.join(","));

      const [activityData, holidayData] = await Promise.all([
        fetchJson<{ activities: ActivityDto[] }>(`/api/activities?${params}`),
        fetchJson<{ holidays: HolidayVacationDto[] }>(
          `/api/holidays?start=${encodeURIComponent(visibleRange.start)}&end=${encodeURIComponent(
            visibleRange.end
          )}&enabledOnly=true`
        )
      ]);
      setActivities(activityData.activities);
      setHolidays(holidayData.holidays);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load visible range.");
    } finally {
      setLoading(false);
    }
  }, [filters.categoryIds, filters.search, filters.statuses, visibleRange]);

  const events = useMemo(
    () => [
      ...activities.map(activityToEvent),
      ...holidays
        .filter((holiday) => {
          const holidayLike = holiday.type === "national_holiday" || holiday.type === "cantonal_holiday";
          const vacationLike = holiday.type === "school_vacation" || holiday.type === "custom_vacation";
          return (holidayLike && filters.showHolidays) || (vacationLike && filters.showVacations);
        })
        .map(holidayToEvent)
    ],
    [activities, filters.showHolidays, filters.showVacations, holidays]
  );

  function openCreate(range?: { start: string; end: string }) {
    setSelectedActivity(null);
    setInitialRange(range ?? null);
    setDialogOpen(true);
  }

  async function saveActivity(payload: Record<string, unknown>, id?: string) {
    const isEdit = Boolean(id && selectedActivity);
    const response = await fetch(isEdit ? `/api/activities/${encodeURIComponent(id as string)}` : "/api/activities", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = (await response.json()) as { activity?: ActivityDto; error?: string; issues?: { message: string }[] };
    if (!response.ok) {
      throw new Error(json.issues?.[0]?.message ?? json.error ?? "Could not save activity.");
    }
    toast.success(isEdit ? "Activity updated" : "Activity created");
    await loadRange();
  }

  function selectActivity(id: string) {
    const activity = activities.find((candidate) => candidate.id === id);
    if (activity) {
      setSelectedActivity(activity);
      setDetailsOpen(true);
    }
  }

  async function deleteSelected(activity: ActivityDto) {
    const confirmed = window.confirm(`Delete "${activity.title}"?`);
    if (!confirmed) return;
    const response = await fetch(`/api/activities/${encodeURIComponent(activity.id)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        seriesId: activity.seriesId,
        recurrenceDate: activity.recurrenceDate,
        scope: activity.isOccurrence ? "only_this" : "entire_series"
      })
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      toast.error(json.error ?? "Could not delete activity.");
      return;
    }
    setDetailsOpen(false);
    setSelectedActivity(null);
    toast.success("Activity deleted");
    await loadRange();
  }

  async function duplicateSelected(activity: ActivityDto) {
    if (activity.isOccurrence) {
      await saveActivity(
        {
          title: `${activity.title} (copy)`,
          description: activity.description,
          location: activity.location,
          start: activity.start,
          end: activity.end,
          allDay: activity.allDay,
          categoryId: activity.categoryId,
          color: activity.color,
          status: activity.status,
          priority: activity.priority,
          tags: activity.tags,
          notes: activity.notes,
          reminders: activity.reminders,
          recurrenceRule: null
        },
        undefined
      );
    } else {
      const response = await fetch(`/api/activities/${encodeURIComponent(activity.id)}/duplicate`, { method: "POST" });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        toast.error(json.error ?? "Could not duplicate activity.");
        return;
      }
      toast.success("Activity duplicated");
      await loadRange();
    }
    setDetailsOpen(false);
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not available.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.message("Notification permission was not granted.");
      return;
    }
    if (!bootstrap) return;
    const settings = { ...bootstrap.settings, browserNotifications: true };
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (response.ok) {
      setBootstrap({ ...bootstrap, settings });
      toast.success("Browser notifications enabled");
    }
  }

  function createFromSlot(slot: FreeSlot) {
    openCreate({ start: slot.start, end: slot.end });
  }

  if (!bootstrap) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading {APP_NAME}
        </div>
      </main>
    );
  }

  return (
    <main className="grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[20rem_1fr]">
      <Sidebar
        filters={filters}
        onFiltersChange={setFilters}
        categories={bootstrap.categories}
        activities={activities}
        holidays={holidays}
        settings={bootstrap.settings}
        visibleRange={visibleRange}
        onCreate={() => openCreate()}
        onDateNavigate={(date) => calendarRef.current?.gotoDate(date)}
        onCreateFromSlot={createFromSlot}
        onEnableNotifications={enableNotifications}
      />

      <section className="flex min-w-0 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-primary">{APP_NAME}</p>
            <h2 className="truncate text-xl font-semibold">{visibleRange?.title ?? "Calendar"}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous" onClick={() => calendarRef.current?.prev()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => calendarRef.current?.today()}>
              Today
            </Button>
            <Button variant="outline" size="icon" aria-label="Next" onClick={() => calendarRef.current?.next()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Input
              className="w-40"
              type="date"
              aria-label="Go to date"
              onChange={(event) => calendarRef.current?.gotoDate(event.target.value)}
            />
            <Select
              value={view}
              onValueChange={(nextView) => {
                const typed = nextView as CalendarView;
                setView(typed);
                calendarRef.current?.changeView(typed);
              }}
            >
              <SelectTrigger className="w-36">
                <CalendarDays className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">Month</SelectItem>
                <SelectItem value="timeGridWeek">Week</SelectItem>
                <SelectItem value="timeGridDay">Day</SelectItem>
                <SelectItem value="listWeek">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-background p-4">
          {loading ? (
            <div className="absolute right-6 top-6 z-10 rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
              Loading range...
            </div>
          ) : null}
          <div className="h-full rounded-lg border bg-card p-3 shadow-sm">
            <FullCalendarView
              ref={calendarRef}
              initialView={view}
              events={events}
              onDatesSet={setVisibleRange}
              onSelectRange={(range) => openCreate(range)}
              onActivityClick={selectActivity}
            />
          </div>
        </div>
      </section>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={selectedActivity}
        categories={bootstrap.categories}
        initialRange={initialRange}
        onSubmit={saveActivity}
      />
      <ActivityDetails
        activity={selectedActivity}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={(activity) => {
          setSelectedActivity(activity);
          setDetailsOpen(false);
          setDialogOpen(true);
        }}
        onDelete={deleteSelected}
        onDuplicate={duplicateSelected}
      />
    </main>
  );
}

function activityToEvent(activity: ActivityDto): EventInput {
  return {
    id: activity.id,
    title: activity.title,
    start: activity.start,
    end: toFullCalendarExclusiveEnd(activity.end, activity.allDay),
    allDay: activity.allDay,
    backgroundColor: activity.status === "cancelled" ? "#64748b" : activity.color,
    borderColor: activity.color,
    classNames: [`activity-${activity.status}`, `priority-${activity.priority}`],
    extendedProps: { kind: "activity", status: activity.status }
  };
}

function holidayToEvent(holiday: HolidayVacationDto): EventInput {
  const vacation = holiday.type === "school_vacation" || holiday.type === "custom_vacation";
  return {
    id: `holiday-${holiday.id}`,
    title: holiday.name,
    start: holiday.start,
    end: toFullCalendarExclusiveEnd(holiday.end, true),
    allDay: true,
    editable: false,
    classNames: [vacation ? "vacation-event" : "holiday-event"],
    extendedProps: { kind: "holiday", type: holiday.type }
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Request failed.");
  }
  return json as T;
}
