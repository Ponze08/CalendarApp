"use client";

import { useState } from "react";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toDateInputValue } from "@/lib/dates";
import { titleCase } from "@/lib/utils";
import type { HolidayVacationDto, HolidayVacationType } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const holidayTypes: HolidayVacationType[] = [
  "national_holiday",
  "cantonal_holiday",
  "school_vacation",
  "custom_vacation"
];

export function HolidayManager({
  holidays,
  onHolidaysChange
}: {
  holidays: HolidayVacationDto[];
  onHolidaysChange: (holidays: HolidayVacationDto[]) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, HolidayVacationDto>>({});
  const [importText, setImportText] = useState("");
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    type: "custom_vacation" as HolidayVacationType,
    start: toDateInputValue(new Date()),
    end: toDateInputValue(new Date()),
    source: "User"
  });

  async function addHoliday() {
    const response = await fetch("/api/holidays", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...newHoliday,
        start: `${newHoliday.start}T00:00:00.000Z`,
        end: `${newHoliday.end}T23:59:59.999Z`,
        allDay: true,
        canton: "TI",
        country: "CH",
        enabled: true
      })
    });
    const json = (await response.json()) as { holiday?: HolidayVacationDto; error?: string };
    if (json.holiday) {
      onHolidaysChange([...holidays, json.holiday].sort((a, b) => a.start.localeCompare(b.start)));
      setNewHoliday({ ...newHoliday, name: "" });
    } else {
      window.alert(json.error ?? "Could not add holiday.");
    }
  }

  async function saveHoliday(holiday: HolidayVacationDto) {
    const draft = drafts[holiday.id] ?? holiday;
    const response = await fetch(`/api/holidays/${holiday.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft)
    });
    const json = (await response.json()) as { holiday?: HolidayVacationDto; error?: string };
    if (json.holiday) {
      onHolidaysChange(holidays.map((entry) => (entry.id === holiday.id ? json.holiday! : entry)));
      setDrafts(({ [holiday.id]: _removed, ...rest }) => rest);
    } else {
      window.alert(json.error ?? "Could not save holiday.");
    }
  }

  async function deleteHoliday(id: string) {
    if (!window.confirm("Delete this holiday or vacation entry?")) return;
    const response = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    if (response.ok) {
      onHolidaysChange(holidays.filter((entry) => entry.id !== id));
    }
  }

  async function importHolidays() {
    const parsed = JSON.parse(importText) as { holidays?: unknown[] };
    const response = await fetch("/api/holidays/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed)
    });
    if (response.ok) {
      setImportText("");
      const refreshed = await fetch("/api/holidays").then((res) => res.json() as Promise<{ holidays: HolidayVacationDto[] }>);
      onHolidaysChange(refreshed.holidays);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Manage Holidays & Vacations</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_12rem_10rem_10rem_8rem_auto]">
        <div>
          <Label>Name</Label>
          <Input className="mt-2" value={newHoliday.name} onChange={(event) => setNewHoliday({ ...newHoliday, name: event.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={newHoliday.type} onValueChange={(type) => setNewHoliday({ ...newHoliday, type: type as HolidayVacationType })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {holidayTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start</Label>
          <Input className="mt-2" type="date" value={newHoliday.start} onChange={(event) => setNewHoliday({ ...newHoliday, start: event.target.value })} />
        </div>
        <div>
          <Label>End</Label>
          <Input className="mt-2" type="date" value={newHoliday.end} onChange={(event) => setNewHoliday({ ...newHoliday, end: event.target.value })} />
        </div>
        <div>
          <Label>Source</Label>
          <Input className="mt-2" value={newHoliday.source} onChange={(event) => setNewHoliday({ ...newHoliday, source: event.target.value })} />
        </div>
        <Button className="self-end" type="button" onClick={addHoliday} disabled={!newHoliday.name.trim()}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-5 max-h-[34rem] space-y-2 overflow-auto pr-1">
        {holidays.map((holiday) => {
          const draft = drafts[holiday.id] ?? holiday;
          return (
            <div key={holiday.id} className="grid gap-2 rounded-md border bg-background p-3 xl:grid-cols-[1fr_11rem_9rem_9rem_6rem_auto_auto]">
              <Input value={draft.name} onChange={(event) => setDrafts({ ...drafts, [holiday.id]: { ...draft, name: event.target.value } })} />
              <Select value={draft.type} onValueChange={(type) => setDrafts({ ...drafts, [holiday.id]: { ...draft, type: type as HolidayVacationType } })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {holidayTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={toDateInputValue(draft.start)} onChange={(event) => setDrafts({ ...drafts, [holiday.id]: { ...draft, start: `${event.target.value}T00:00:00.000Z` } })} />
              <Input type="date" value={toDateInputValue(draft.end)} onChange={(event) => setDrafts({ ...drafts, [holiday.id]: { ...draft, end: `${event.target.value}T23:59:59.999Z` } })} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={draft.enabled} onCheckedChange={(checked) => setDrafts({ ...drafts, [holiday.id]: { ...draft, enabled: checked === true } })} />
                Enabled
              </label>
              <Button type="button" variant="outline" size="sm" onClick={() => saveHoliday(holiday)}>
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => deleteHoliday(holiday.id)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <p className="text-xs text-muted-foreground xl:col-span-7">
                {titleCase(holiday.type)} · {holiday.source}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md border bg-background p-4">
        <Label>Import holidays/vacations JSON</Label>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
          value={importText}
          placeholder='{"holidays":[{"name":"Custom vacation","type":"custom_vacation","start":"2027-07-01T00:00:00.000Z","end":"2027-07-07T23:59:59.999Z","allDay":true,"source":"User","enabled":true}]}'
          onChange={(event) => setImportText(event.target.value)}
        />
        <Button className="mt-3" type="button" variant="outline" onClick={importHolidays} disabled={!importText.trim()}>
          <Upload className="h-4 w-4" />
          Import holiday data
        </Button>
      </div>
    </section>
  );
}
