"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import { formatZurichDateTime, durationLabel } from "@/lib/dates";
import { titleCase } from "@/lib/utils";
import type { ActivityDto } from "@/types/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type Props = {
  activity: ActivityDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (activity: ActivityDto) => void;
  onDelete: (activity: ActivityDto) => void;
  onDuplicate: (activity: ActivityDto) => void;
};

export function ActivityDetails({
  activity,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDuplicate
}: Props) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: activity.color }} />
            {activity.title}
          </DialogTitle>
          <DialogDescription>
            {formatZurichDateTime(activity.start)} - {formatZurichDateTime(activity.end, "HH:mm")} ·{" "}
            {durationLabel(activity.start, activity.end)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{titleCase(activity.status)}</Badge>
            <Badge variant="outline">{titleCase(activity.priority)}</Badge>
            {activity.category ? <Badge variant="outline">{activity.category.name}</Badge> : null}
            {activity.isOccurrence ? <Badge>Recurring occurrence</Badge> : null}
          </div>

          {activity.description ? (
            <section>
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{activity.description}</p>
            </section>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Location</dt>
              <dd className="text-muted-foreground">{activity.location || "None"}</dd>
            </div>
            <div>
              <dt className="font-medium">Reminder</dt>
              <dd className="text-muted-foreground">
                {activity.reminders.length ? activity.reminders.map((reminder) => reminder.label).join(", ") : "None"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Tags</dt>
              <dd className="text-muted-foreground">{activity.tags.length ? activity.tags.join(", ") : "None"}</dd>
            </div>
            <div>
              <dt className="font-medium">Recurrence</dt>
              <dd className="text-muted-foreground">
                {activity.recurrenceRule ? titleCase(activity.recurrenceRule.frequency) : "Does not repeat"}
              </dd>
            </div>
          </dl>

          {activity.notes ? (
            <section>
              <h3 className="text-sm font-semibold">Notes</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{activity.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button variant="destructive" onClick={() => onDelete(activity)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={() => onDuplicate(activity)}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button onClick={() => onEdit(activity)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
