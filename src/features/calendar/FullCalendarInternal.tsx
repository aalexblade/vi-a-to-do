"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Loader2,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Edit2,
  Save,
} from "lucide-react";
import {
  updateCalendarEventDates,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./actions";
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

interface EventClickInfo {
  event: {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
    extendedProps: {
      description?: string;
    };
  };
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");
  const [selectedDates, setSelectedDates] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    description?: string;
    start?: Date | null;
    end?: Date | null;
  } | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [isPending, setIsPending] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<CalendarApi | null>(null);

  if (prevInitialEvents !== initialEvents) {
    setPrevInitialEvents(initialEvents);
    setEvents(initialEvents);
  }

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

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

  const handleDateSelect = (info: DateSelectInfo) => {
    setSelectedDates({ start: info.start, end: info.end });
    setStartTimeInput(formatTimeForInput(info.start));
    setEndTimeInput(formatTimeForInput(info.end));
    setTitleInput("");
    setDescriptionInput("");
    setIsCreateOpen(true);
  };

  const handleEventClick = (info: EventClickInfo) => {
    const start = info.event.start;
    const end = info.event.end;

    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      start,
      end,
    });

    setEditTitle(info.event.title);
    setEditDescription(info.event.extendedProps.description || "");
    setEditStartTime(start ? formatTimeForInput(start) : "");
    setEditEndTime(end ? formatTimeForInput(end) : "");
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDates || !titleInput.trim()) return;

    const finalStart = new Date(selectedDates.start);
    if (startTimeInput) {
      const [hours, minutes] = startTimeInput.split(":").map(Number);
      finalStart.setHours(hours, minutes, 0, 0);
    }

    const finalEnd = new Date(selectedDates.end);
    if (endTimeInput) {
      const [hours, minutes] = endTimeInput.split(":").map(Number);
      finalEnd.setHours(hours, minutes, 0, 0);
    }

    setIsPending(true);
    const newEvent = await createCalendarEvent({
      title: titleInput.trim(),
      description: descriptionInput.trim(),
      startDate: finalStart,
      endDate: finalEnd,
    });

    if (newEvent) {
      setEvents((prev) => [...prev, newEvent]);
    }
    setIsPending(false);
    setIsCreateOpen(false);
    setSelectedDates(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle.trim()) return;

    const baseStart = selectedEvent.start
      ? new Date(selectedEvent.start)
      : new Date();
    if (editStartTime) {
      const [hours, minutes] = editStartTime.split(":").map(Number);
      baseStart.setHours(hours, minutes, 0, 0);
    }

    const baseEnd = selectedEvent.end
      ? new Date(selectedEvent.end)
      : new Date(baseStart);
    if (editEndTime) {
      const [hours, minutes] = editEndTime.split(":").map(Number);
      baseEnd.setHours(hours, minutes, 0, 0);
    }

    setIsPending(true);

    await updateCalendarEventDates(selectedEvent.id, baseStart, baseEnd);

    setEvents((prev) =>
      prev.map((item) =>
        item.id === selectedEvent.id
          ? {
              ...item,
              title: editTitle.trim(),
              description: editDescription.trim(),
              startDate: baseStart,
              endDate: baseEnd,
            }
          : item,
      ),
    );

    setIsPending(false);
    setIsEditing(false);
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsPending(true);
    await deleteCalendarEvent(selectedEvent.id);
    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
    setIsPending(false);
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const formattedEvents = useMemo(() => {
    return events.map((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        extendedProps: {
          description: event.description,
        },
        allDay:
          start.getHours() === 0 &&
          start.getMinutes() === 0 &&
          end.getHours() === 0 &&
          end.getMinutes() === 0 &&
          start.toDateString() === end.toDateString(),
      };
    });
  }, [events]);

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
        eventResize: (info: unknown) =>
          handleEventResize(info as EventChangeInfo),
        select: (info: unknown) => handleDateSelect(info as DateSelectInfo),
        eventClick: (info: unknown) => handleEventClick(info as EventClickInfo),
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

  useEffect(() => {
    if (calendarInstanceRef.current) {
      calendarInstanceRef.current.removeAllEventSources();
      calendarInstanceRef.current.addEventSource(formattedEvents);
    }
  }, [formattedEvents]);

  const formatSelectedDateTime = (start?: Date | null, end?: Date | null) => {
    if (!start) return "";
    const startDateStr = start.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
    });
    const startTimeStr = start.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = end
      ? end.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
      : "";

    if (startTimeStr === "00:00" && (!endTimeStr || endTimeStr === "00:00")) {
      return startDateStr;
    }

    return `${startDateStr}, ${startTimeStr} ${endTimeStr ? `- ${endTimeStr}` : ""}`;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
      <div ref={calendarRef} />

      {/* Модальне вікно створення події */}
      {isCreateOpen && selectedDates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Нова подія
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>
                {selectedDates.start.toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                >
                  Назва події *
                </label>
                <input
                  type="text"
                  id="title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                  autoFocus
                  placeholder="Наприклад, Зустріч з командою"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Початок
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Кінець
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                >
                  {"Опис (необов'язково)"}
                </label>
                <textarea
                  id="description"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  rows={3}
                  placeholder="Додайте нотатки чи деталі..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={!titleInput.trim() || isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Створити
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {isDetailOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? "Редагувати подію" : selectedEvent.title}
                </h2>
                {!isEditing && selectedEvent.start && (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>
                      {formatSelectedDateTime(
                        selectedEvent.start,
                        selectedEvent.end,
                      )}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="editTitle"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Назва події *
                  </label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="editStartTime"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                    >
                      Початок
                    </label>
                    <input
                      type="time"
                      id="editStartTime"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="editEndTime"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                    >
                      Кінець
                    </label>
                    <input
                      type="time"
                      id="editEndTime"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="editDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    {"Опис (необов'язково)"}
                  </label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={!editTitle.trim() || isPending}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Зберегти
                  </button>
                </div>
              </form>
            ) : (
              <>
                {selectedEvent.description ? (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    {selectedEvent.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-gray-400 italic">
                    Опис відсутній
                  </p>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={isPending}
                    className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-600 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Видалити
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-600 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 className="mr-1.5 h-4 w-4" />
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Закрити
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
