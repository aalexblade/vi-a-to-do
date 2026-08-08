"use client";

import { useState, useEffect, useRef } from "react";
import { updateCalendarEventDates, createCalendarEvent } from "./actions";
import { CalendarEvent } from "./types";

interface FullCalendarInternalProps {
  initialEvents: CalendarEvent[];
}

interface EventChangeInfo {
  event: {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
  };
}

interface DateSelectInfo {
  start: Date;
  end: Date;
}

export default function FullCalendarInternal({
  initialEvents,
}: FullCalendarInternalProps) {
  const [prevInitialEvents, setPrevInitialEvents] =
    useState<CalendarEvent[]>(initialEvents);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarApiRef = useRef<unknown>(null);

  if (prevInitialEvents !== initialEvents) {
    setPrevInitialEvents(initialEvents);
    setEvents(initialEvents);
  }

  const handleEventDrop = async (info: EventChangeInfo) => {
    const { id, start, end } = info.event;
    if (start) {
      await updateCalendarEventDates(id, start, end || start);
    }
  };

  const handleEventResize = async (info: EventChangeInfo) => {
    const { id, start, end } = info.event;
    if (start && end) {
      await updateCalendarEventDates(id, start, end);
    }
  };

  const handleDateSelect = async (info: DateSelectInfo) => {
    const title = prompt("Enter Event Title:");
    if (title) {
      const newEvent = await createCalendarEvent({
        title,
        description: "",
        startDate: info.start,
        endDate: info.end,
      });

      if (newEvent) {
        setEvents((prev) => [...prev, newEvent]);
      }
    }
  };

  useEffect(() => {
    if (!calendarRef.current) return;

    let calendarInstance: { destroy: () => void; render: () => void } | null =
      null;

    Promise.all([
      import("@fullcalendar/core"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
    ]).then(([coreMod, dayGridMod, timeGridMod, interactionMod]) => {
      const Calendar = coreMod.Calendar;
      const dayGrid = dayGridMod.default;
      const timeGrid = timeGridMod.default;
      const interaction = interactionMod.default;

      if (!calendarRef.current) return;

      const formattedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
      }));

      calendarInstance = new Calendar(calendarRef.current, {
        plugins: [dayGrid, timeGrid, interaction],
        initialView: "dayGridMonth",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        events: formattedEvents,
        eventDrop: (info: unknown) => handleEventDrop(info as EventChangeInfo),
        eventResize: (info: unknown) =>
          handleEventResize(info as EventChangeInfo),
        select: (info: unknown) => handleDateSelect(info as DateSelectInfo),
      });

      calendarInstance.render();
      calendarApiRef.current = calendarInstance;
    });

    return () => {
      if (calendarInstance) {
        calendarInstance.destroy();
      }
    };
  }, [events]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
      <div ref={calendarRef} />
    </div>
  );
}
