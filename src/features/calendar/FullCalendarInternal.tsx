"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { updateCalendarEventDates, createCalendarEvent } from "./actions";
import { CalendarEvent } from "./types";

interface FullCalendarInternalProps {
  initialEvents: CalendarEvent[];
}

interface EventChangeInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
  };
}

interface DateSelectInfo {
  start: Date;
  end: Date;
  allDay: boolean;
}

interface CalendarApi {
  destroy: () => void;
  removeAllEventSources: () => void;
  addEventSource: (events: unknown) => void;
}

export default function FullCalendarInternal({
  initialEvents,
}: FullCalendarInternalProps) {
  const [prevInitialEvents, setPrevInitialEvents] =
    useState<CalendarEvent[]>(initialEvents);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<CalendarApi | null>(null);

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

  // Мемоїзація відформатованих подій під формат FullCalendar
  const formattedEvents = useMemo(() => {
    return events.map((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        allDay:
          start.getHours() === 0 &&
          start.getMinutes() === 0 &&
          end.getHours() === 0 &&
          end.getMinutes() === 0 &&
          start.toDateString() === end.toDateString(),
      };
    });
  }, [events]);

  // 1. Ініціалізація календаря (виконується лише один раз при маунті)
  useEffect(() => {
    if (!calendarRef.current) return;

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

      if (!calendarRef.current || calendarInstanceRef.current) return;

      const calendarInstance = new Calendar(calendarRef.current, {
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

        slotDuration: "00:30:00",
        snapDuration: "00:15:00",
        slotMinTime: "00:00:00",
        slotMaxTime: "24:00:00",
        allDaySlot: true,

        events: formattedEvents,
        eventDrop: (info: unknown) => handleEventDrop(info as EventChangeInfo),
        eventResize: (info: unknown) => handleEventResize(info as EventChangeInfo),
        select: (info: unknown) => handleDateSelect(info as DateSelectInfo),
      });

      calendarInstance.render();
      calendarInstanceRef.current = calendarInstance as unknown as CalendarApi;
    });

    return () => {
      if (calendarInstanceRef.current) {
        calendarInstanceRef.current.destroy();
        calendarInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Реактивне оновлення подій БЕЗ перемикання виду календаря
  useEffect(() => {
    if (calendarInstanceRef.current) {
      calendarInstanceRef.current.removeAllEventSources();
      calendarInstanceRef.current.addEventSource(formattedEvents);
    }
  }, [formattedEvents]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
      <div ref={calendarRef} />
    </div>
  );
}