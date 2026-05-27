"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { activityPriorities, activityStatuses, reminderOptions } from "@/lib/constants";
import { toDateInputValue, toDateTimeLocalValue } from "@/lib/dates";
import { titleCase } from "@/lib/utils";
import type { ActivityDto, CategoryDto, ReminderDto } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type ActivityPayload = Record<string, unknown>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityDto | null;
  categories: CategoryDto[];
  initialRange: { start: string; end: string } | null;
  onSubmit: (payload: ActivityPayload, id?: string) => Promise<void>;
};

const weekdays = [
  ["MO", "Mon"],
  ["TU", "Tue"],
  ["WE", "Wed"],
  ["TH", "Thu"],
  ["FR", "Fri"],
  ["SA", "Sat"],
  ["SU", "Sun"]
] as const;

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  categories,
  initialRange,
  onSubmit
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => createInitialForm(activity, initialRange, categories));

  useEffect(() => {
    if (open) {
      setForm(createInitialForm(activity, initialRange, categories));
      setError(null);
    }
  }, [activity, categories, initialRange, open]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId),
    [categories, form.categoryId]
  );

  useEffect(() => {
    if (selectedCategory && !activity) {
      setForm((current) => ({ ...current, color: selectedCategory.color }));
    }
  }, [activity, selectedCategory]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const reminders: ReminderDto[] =
        form.reminder === "none"
          ? []
          : [
              {
                offsetMinutes:
                  form.reminder === "custom" ? Number(form.customReminderMinutes) : Number(form.reminder),
                label:
                  form.reminder === "custom"
                    ? `${form.customReminderMinutes} minutes before`
                    : reminderOptions.find((option) => option.offsetMinutes === Number(form.reminder))?.label ??
                      "Reminder",
                custom: form.reminder === "custom"
              }
            ];

      const payload: ActivityPayload = {
        title: form.title,
        description: form.description,
        location: form.location,
        start: form.allDay ? `${form.startDate}T00:00:00.000` : form.startDateTime,
        end: form.allDay ? `${form.endDate}T23:59:59.999` : form.endDateTime,
        allDay: form.allDay,
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        color: form.color,
        status: form.status,
        priority: form.priority,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: form.notes,
        reminders,
        recurrenceRule: form.repeats
          ? {
              frequency: form.frequency,
              interval: Number(form.interval),
              weekdays: form.frequency === "weekly" ? form.weekdays.join(",") : null,
              monthDay: form.frequency === "monthly" && form.monthDay ? Number(form.monthDay) : null,
              endType: form.endType,
              until: form.endType === "on_date" && form.until ? `${form.until}T23:59:59.999` : null,
              count: form.endType === "after_count" ? Number(form.count) : null
            }
          : null,
        recurrenceScope: form.recurrenceScope,
        recurrenceDate: activity?.recurrenceDate,
        seriesId: activity?.seriesId
      };

      await onSubmit(payload, activity?.id);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {activity ? "Edit activity" : "Create activity"}
          </DialogTitle>
          <DialogDescription>
            Activities support reminders, tags, priorities, statuses, and recurring schedules.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </Field>
          <Field label="Category">
            <Select value={form.categoryId} onValueChange={(categoryId) => setForm({ ...form, categoryId })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox
              checked={form.allDay}
              onCheckedChange={(checked) => setForm({ ...form, allDay: checked === true })}
            />
            All-day activity
          </label>

          {form.allDay ? (
            <>
              <Field label="Start date">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                />
              </Field>
              <Field label="End date">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Start">
                <Input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(event) => setForm({ ...form, startDateTime: event.target.value })}
                />
              </Field>
              <Field label="End">
                <Input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(event) => setForm({ ...form, endDateTime: event.target.value })}
                />
              </Field>
            </>
          )}

          <Field label="Status">
            <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {titleCase(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(priority) => setForm({ ...form, priority })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityPriorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {titleCase(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Color">
            <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          </Field>
          <Field label="Reminder">
            <Select value={form.reminder} onValueChange={(reminder) => setForm({ ...form, reminder })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderOptions.map((option) => (
                  <SelectItem key={option.label} value={Number.isNaN(option.offsetMinutes) ? "none" : option.offsetMinutes === -1 ? "custom" : String(option.offsetMinutes)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {form.reminder === "custom" ? (
            <Field label="Custom minutes before">
              <Input
                type="number"
                min={0}
                value={form.customReminderMinutes}
                onChange={(event) => setForm({ ...form, customReminderMinutes: event.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Tags" className="md:col-span-2">
            <Input
              value={form.tags}
              placeholder="planning, family, Lugano"
              onChange={(event) => setForm({ ...form, tags: event.target.value })}
            />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={form.repeats}
              onCheckedChange={(checked) => setForm({ ...form, repeats: checked === true })}
            />
            Repeats
          </label>
          {form.repeats ? (
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="Frequency">
                <Select value={form.frequency} onValueChange={(frequency) => setForm({ ...form, frequency })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["daily", "weekly", "monthly", "yearly"].map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {titleCase(frequency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Interval">
                <Input
                  type="number"
                  min={1}
                  value={form.interval}
                  onChange={(event) => setForm({ ...form, interval: event.target.value })}
                />
              </Field>
              <Field label="End">
                <Select value={form.endType} onValueChange={(endType) => setForm({ ...form, endType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="on_date">On date</SelectItem>
                    <SelectItem value="after_count">After count</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.endType === "on_date" ? (
                <Field label="Until">
                  <Input type="date" value={form.until} onChange={(event) => setForm({ ...form, until: event.target.value })} />
                </Field>
              ) : null}
              {form.endType === "after_count" ? (
                <Field label="Count">
                  <Input
                    type="number"
                    min={1}
                    value={form.count}
                    onChange={(event) => setForm({ ...form, count: event.target.value })}
                  />
                </Field>
              ) : null}
              {form.frequency === "weekly" ? (
                <div className="md:col-span-4">
                  <Label>Weekdays</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekdays.map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                        <Checkbox
                          checked={form.weekdays.includes(value)}
                          onCheckedChange={(checked) => {
                            setForm((current) => ({
                              ...current,
                              weekdays:
                                checked === true
                                  ? [...current.weekdays, value]
                                  : current.weekdays.filter((weekday) => weekday !== value)
                            }));
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {activity?.isOccurrence ? (
          <Field label="Apply changes to">
            <Select
              value={form.recurrenceScope}
              onValueChange={(recurrenceScope) => setForm({ ...form, recurrenceScope })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="only_this">Only this occurrence</SelectItem>
                <SelectItem value="this_and_future">This and future occurrences</SelectItem>
                <SelectItem value="entire_series">Entire series</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : "Save activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function createInitialForm(
  activity: ActivityDto | null,
  initialRange: { start: string; end: string } | null,
  categories: CategoryDto[]
) {
  const start = activity?.start ?? initialRange?.start ?? new Date().toISOString();
  const end =
    activity?.end ??
    initialRange?.end ??
    new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
  const reminder = activity?.reminders[0];
  const recurrence = activity?.recurrenceRule;
  const categoryId = activity?.categoryId ?? categories[0]?.id ?? "none";

  return {
    title: activity?.title ?? "",
    description: activity?.description ?? "",
    location: activity?.location ?? "",
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    startDateTime: toDateTimeLocalValue(start),
    endDateTime: toDateTimeLocalValue(end),
    allDay: activity?.allDay ?? false,
    categoryId,
    color: activity?.color ?? categories.find((category) => category.id === categoryId)?.color ?? "#2563eb",
    status: activity?.status ?? "confirmed",
    priority: activity?.priority ?? "medium",
    tags: activity?.tags.join(", ") ?? "",
    notes: activity?.notes ?? "",
    reminder: reminder ? (reminder.custom ? "custom" : String(reminder.offsetMinutes)) : "none",
    customReminderMinutes: reminder?.custom ? String(reminder.offsetMinutes) : "45",
    repeats: Boolean(recurrence),
    frequency: recurrence?.frequency ?? "weekly",
    interval: String(recurrence?.interval ?? 1),
    weekdays: recurrence?.weekdays ? recurrence.weekdays.split(",") : ["MO"],
    monthDay: String(recurrence?.monthDay ?? new Date(start).getDate()),
    endType: recurrence?.endType ?? "never",
    until: recurrence?.until ? toDateInputValue(recurrence.until) : "",
    count: String(recurrence?.count ?? 10),
    recurrenceScope: "only_this"
  };
}
