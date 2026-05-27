"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import type { CalendarView } from "@/types/calendar";

export type CalendarHandle = {
  today: () => void;
  prev: () => void;
  next: () => void;
  gotoDate: (date: string) => void;
  changeView: (view: CalendarView) => void;
};

type Props = {
  events: EventInput[];
  initialView: CalendarView;
  onDatesSet: (range: { start: string; end: string; title: string }) => void;
  onSelectRange: (range: { start: string; end: string; allDay: boolean }) => void;
  onActivityClick: (id: string) => void;
};

export const FullCalendarView = forwardRef<CalendarHandle, Props>(
  ({ events, initialView, onDatesSet, onSelectRange, onActivityClick }, ref) => {
    const calendarRef = useRef<FullCalendar | null>(null);

    useImperativeHandle(ref, () => ({
      today: () => calendarRef.current?.getApi().today(),
      prev: () => calendarRef.current?.getApi().prev(),
      next: () => calendarRef.current?.getApi().next(),
      gotoDate: (date) => calendarRef.current?.getApi().gotoDate(date),
      changeView: (view) => calendarRef.current?.getApi().changeView(view)
    }));

    return (
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={false}
        events={events}
        height="100%"
        expandRows
        selectable
        nowIndicator
        dayMaxEvents
        weekNumbers
        firstDay={1}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDayMaintainDuration
        datesSet={(arg: DatesSetArg) =>
          onDatesSet({ start: arg.start.toISOString(), end: arg.end.toISOString(), title: arg.view.title })
        }
        select={(arg: DateSelectArg) =>
          onSelectRange({ start: arg.start.toISOString(), end: arg.end.toISOString(), allDay: arg.allDay })
        }
        eventClick={(arg: EventClickArg) => {
          const kind = arg.event.extendedProps.kind as string | undefined;
          if (kind === "activity") {
            onActivityClick(arg.event.id);
          }
        }}
        eventContent={renderEventContent}
      />
    );
  }
);
FullCalendarView.displayName = "FullCalendarView";

function renderEventContent(arg: EventContentArg) {
  const kind = arg.event.extendedProps.kind as string | undefined;
  const status = arg.event.extendedProps.status as string | undefined;
  return (
    <div className="min-w-0">
      {arg.timeText ? <span className="mr-1 text-[11px] opacity-80">{arg.timeText}</span> : null}
      <span className="truncate">{kind === "holiday" ? ` ${arg.event.title}` : arg.event.title}</span>
      {status === "tentative" ? <span className="sr-only">tentative</span> : null}
    </div>
  );
}
