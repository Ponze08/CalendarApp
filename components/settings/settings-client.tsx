"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Database, Download, Save, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { CalendarBootstrap, HolidayVacationDto, UserSettingsDto } from "@/types/calendar";
import { CategoryManager } from "@/components/settings/category-manager";
import { HolidayManager } from "@/components/holidays/holiday-manager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const weekDays = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"]
] as const;

export function SettingsClient() {
  const { setTheme } = useTheme();
  const [bootstrap, setBootstrap] = useState<CalendarBootstrap | null>(null);
  const [settings, setSettings] = useState<UserSettingsDto | null>(null);
  const [holidays, setHolidays] = useState<HolidayVacationDto[]>([]);
  const [importFormat, setImportFormat] = useState("json");
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [boot, holidayData] = await Promise.all([
      fetch("/api/bootstrap").then((res) => res.json() as Promise<CalendarBootstrap>),
      fetch("/api/holidays").then((res) => res.json() as Promise<{ holidays: HolidayVacationDto[] }>)
    ]);
    setBootstrap(boot);
    setSettings(boot.settings);
    setHolidays(holidayData.holidays);
  }

  async function saveSettings() {
    if (!settings) return;
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings)
    });
    const json = (await response.json()) as { settings?: UserSettingsDto; error?: string };
    if (json.settings) {
      setSettings(json.settings);
      setTheme(json.settings.theme);
      toast.success("Settings saved");
    } else {
      toast.error(json.error ?? "Could not save settings.");
    }
  }

  async function resetSeedData() {
    const response = await fetch("/api/settings/reset-seed", { method: "POST" });
    if (response.ok) {
      toast.success("Seed data restored");
      await load();
    } else {
      toast.error("Could not restore seed data.");
    }
  }

  async function importActivities() {
    if (!importFile) return;
    const formData = new FormData();
    formData.set("file", importFile);
    formData.set("format", importFormat);
    const response = await fetch("/api/import", { method: "POST", body: formData });
    const json = (await response.json()) as { imported?: number; error?: string };
    if (response.ok) {
      toast.success(`Imported ${json.imported ?? 0} activities`);
      setImportFile(null);
    } else {
      toast.error(json.error ?? "Import failed.");
    }
  }

  if (!bootstrap || !settings) {
    return <main className="p-8 text-muted-foreground">Loading settings...</main>;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure calendar defaults, working time, data, categories, and Ticino holiday layers.
            </p>
          </div>
          <Button type="button" onClick={saveSettings}>
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Calendar Preferences</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Timezone">
              <Input value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} />
            </Field>
            <Field label="Locale">
              <Input value={settings.locale} onChange={(event) => setSettings({ ...settings, locale: event.target.value })} />
            </Field>
            <Field label="Default view">
              <Select value={settings.defaultView} onValueChange={(defaultView) => setSettings({ ...settings, defaultView: defaultView as UserSettingsDto["defaultView"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dayGridMonth">Month</SelectItem>
                  <SelectItem value="timeGridWeek">Week</SelectItem>
                  <SelectItem value="timeGridDay">Day</SelectItem>
                  <SelectItem value="listWeek">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Theme">
              <Select value={settings.theme} onValueChange={(theme) => setSettings({ ...settings, theme: theme as UserSettingsDto["theme"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Working start">
              <Input type="time" value={settings.workingStart} onChange={(event) => setSettings({ ...settings, workingStart: event.target.value })} />
            </Field>
            <Field label="Working end">
              <Input type="time" value={settings.workingEnd} onChange={(event) => setSettings({ ...settings, workingEnd: event.target.value })} />
            </Field>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Working days</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map(([day, label]) => (
                  <label key={day} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <Checkbox
                      checked={settings.workingDays.includes(day)}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          workingDays:
                            checked === true
                              ? [...settings.workingDays, day].sort()
                              : settings.workingDays.filter((item) => item !== day)
                        });
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <Toggle label="Show holidays" checked={settings.showHolidays} onChange={(showHolidays) => setSettings({ ...settings, showHolidays })} />
              <Toggle label="Show school vacations" checked={settings.showSchoolVacations} onChange={(showSchoolVacations) => setSettings({ ...settings, showSchoolVacations })} />
              <Toggle label="Exclude holidays from availability" checked={settings.excludeHolidays} onChange={(excludeHolidays) => setSettings({ ...settings, excludeHolidays })} />
              <Toggle label="Exclude vacations from availability" checked={settings.excludeVacations} onChange={(excludeVacations) => setSettings({ ...settings, excludeVacations })} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Import & Export</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_10rem_auto_auto_auto]">
            <Input type="file" accept=".json,.ics,text/calendar,application/json" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
            <Select value={importFormat} onValueChange={setImportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="ics">ICS</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={importActivities} disabled={!importFile}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export?format=json">
                <Download className="h-4 w-4" />
                Export JSON
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export?format=ics">
                <Download className="h-4 w-4" />
                Export ICS
              </a>
            </Button>
          </div>
          <Button className="mt-4" type="button" variant="secondary" onClick={resetSeedData}>
            <Database className="h-4 w-4" />
            Reset seed data
          </Button>
        </section>

        <CategoryManager
          categories={bootstrap.categories}
          onCategoriesChange={(categories) => setBootstrap({ ...bootstrap, categories })}
        />
        <HolidayManager holidays={holidays} onHolidaysChange={setHolidays} />
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
