"use client";

import { useState } from "react";
import { SearchCheck } from "lucide-react";
import { toDateInputValue } from "@/lib/dates";
import type { FreeSlot } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AvailabilityPanel({
  onCreateFromSlot
}: {
  onCreateFromSlot: (slot: FreeSlot) => void;
}) {
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [start, setStart] = useState(toDateInputValue(new Date()));
  const [end, setEnd] = useState(toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [workingHoursOnly, setWorkingHoursOnly] = useState(true);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [excludeVacations, setExcludeVacations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function findSlots() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          durationMinutes: Number(durationMinutes),
          start: `${start}T00:00:00.000`,
          end: `${end}T23:59:59.999`,
          workingHoursOnly,
          excludeHolidays,
          excludeVacations
        })
      });
      const json = (await response.json()) as { slots?: FreeSlot[]; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not find slots.");
      setSlots(json.slots ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not find slots.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <SearchCheck className="h-4 w-4 text-primary" />
        Find free slot
      </h2>
      <div className="mt-3 grid gap-3">
        <div>
          <Label>Duration minutes</Label>
          <Input
            className="mt-2"
            type="number"
            min={5}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>From</Label>
            <Input className="mt-2" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input className="mt-2" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          </div>
        </div>
        <Toggle checked={workingHoursOnly} onCheckedChange={setWorkingHoursOnly} label="Working hours only" />
        <Toggle checked={excludeHolidays} onCheckedChange={setExcludeHolidays} label="Exclude holidays" />
        <Toggle checked={excludeVacations} onCheckedChange={setExcludeVacations} label="Exclude vacations" />
        <Button type="button" onClick={findSlots} disabled={loading}>
          {loading ? "Searching..." : "Search availability"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="max-h-52 space-y-2 overflow-auto pr-1">
          {slots.map((slot) => (
            <button
              type="button"
              key={slot.start}
              className="w-full rounded-md border bg-background p-2 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => onCreateFromSlot(slot)}
            >
              <span className="font-medium">{slot.label}</span>
              <span className="block text-xs text-muted-foreground">Create activity from this slot</span>
            </button>
          ))}
          {!loading && !slots.length ? (
            <p className="text-sm text-muted-foreground">No matching slots yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onCheckedChange,
  label
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      {label}
    </label>
  );
}
