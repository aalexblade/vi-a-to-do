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
  Plus,
  Check,
} from "lucide-react";
import {
  updateCalendarEventDates,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./actions";
import { CalendarEvent } from "./types";
import { Task } from "@/types";

interface FullCalendarInternalProps {
  initialEvents: CalendarEvent[];
  initialTasks?: Task[];
}

interface EventChangeInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
    extendedProps: {
      isTask?: boolean;
    };
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
    backgroundColor?: string;
    extendedProps: {
      description?: string;
      isTask?: boolean;
      priority?: string;
      status?: string;
      color?: string;
    };
  };
}

interface CalendarApi {
  destroy: () => void;
  removeAllEventSources: () => void;
  addEventSource: (events: unknown) => void;
}

// Пресети кольорів для подій
const COLOR_PRESETS = [
  { name: "Blue", value: "#2563eb", border: "#1d4ed8" },
  { name: "Indigo", value: "#4f46e5", border: "#4338ca" },
  { name: "Purple", value: "#7c3aed", border: "#6d28d9" },
  { name: "Pink", value: "#db2777", border: "#be185d" },
  { name: "Emerald", value: "#059669", border: "#047857" },
  { name: "Amber", value: "#d97706", border: "#b45309" },
  { name: "Rose", value: "#e11d48", border: "#be123c" },
  { name: "Dark Slate", value: "#475569", border: "#334155" },
];

const MIN_HOUR = 7;
const MAX_HOUR = 20;

const TIME_SLOTS = Array.from(
  { length: (MAX_HOUR - MIN_HOUR) * 2 + 1 },
  (_, i) => {
    const totalMinutes = MIN_HOUR * 60 + i * 30;
    const hours = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minutes = totalMinutes % 60 === 0 ? "00" : "30";
    return `${hours}:${minutes}`;
  },
);

export default function FullCalendarInternal({
  initialEvents,
  initialTasks = [],
}: FullCalendarInternalProps) {
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [deletedEventIds, setDeletedEventIds] = useState<string[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [colorInput, setColorInput] = useState(COLOR_PRESETS[0].value);
  const [startTimeInput, setStartTimeInput] = useState("09:00");
  const [endTimeInput, setEndTimeInput] = useState("10:00");
  const [selectedDates, setSelectedDates] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    description?: string;
    color?: string;
    start?: Date | null;
    end?: Date | null;
    isTask?: boolean;
    priority?: string;
    status?: string;
  } | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState(COLOR_PRESETS[0].value);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");

  const [isPending, setIsPending] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<CalendarApi | null>(null);

  const activeEvents = useMemo(() => {
    const combinedMap = new Map<string, CalendarEvent>();

    initialEvents.forEach((ev) => {
      if (!deletedEventIds.includes(ev.id)) {
        combinedMap.set(ev.id, ev);
      }
    });

    localEvents.forEach((ev) => {
      if (!deletedEventIds.includes(ev.id)) {
        combinedMap.set(ev.id, ev);
      }
    });

    return Array.from(combinedMap.values());
  }, [initialEvents, localEvents, deletedEventIds]);

  const clampTimeForInput = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes() >= 30 ? "30" : "00";

    if (hours < MIN_HOUR) hours = MIN_HOUR;
    if (hours > MAX_HOUR) hours = MAX_HOUR;

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedTime = `${formattedHours}:${minutes}`;

    return TIME_SLOTS.includes(formattedTime) ? formattedTime : TIME_SLOTS[0];
  };

  const handleQuickAdd = () => {
    const now = new Date();
    setSelectedDates({ start: now, end: now });

    const currentClamped = clampTimeForInput(now);
    setStartTimeInput(currentClamped);

    const startIndex = TIME_SLOTS.indexOf(currentClamped);
    const endIndex = Math.min(
      startIndex !== -1 ? startIndex + 2 : 2,
      TIME_SLOTS.length - 1,
    );
    setEndTimeInput(TIME_SLOTS[endIndex]);

    setTitleInput("");
    setDescriptionInput("");
    setColorInput(COLOR_PRESETS[0].value);
    setIsCreateOpen(true);
  };

  const handleEventDrop = async (info: EventChangeInfo) => {
    if (info.event.extendedProps.isTask) return;
    const { id, start, end } = info.event;
    if (start) {
      const finalEnd = end || start;
      setLocalEvents((prev) => {
        const existing = activeEvents.find((e) => e.id === id);
        if (!existing) return prev;
        return [
          ...prev.filter((e) => e.id !== id),
          { ...existing, startDate: start, endDate: finalEnd },
        ];
      });
      await updateCalendarEventDates(id, start, finalEnd);
    }
  };

  const handleEventResize = async (info: EventChangeInfo) => {
    if (info.event.extendedProps.isTask) return;
    const { id, start, end } = info.event;
    if (start && end) {
      setLocalEvents((prev) => {
        const existing = activeEvents.find((e) => e.id === id);
        if (!existing) return prev;
        return [
          ...prev.filter((e) => e.id !== id),
          { ...existing, startDate: start, endDate: end },
        ];
      });
      await updateCalendarEventDates(id, start, end);
    }
  };

  const handleDateSelect = (info: DateSelectInfo) => {
    setSelectedDates({ start: info.start, end: info.end });
    setStartTimeInput(clampTimeForInput(info.start));
    setEndTimeInput(clampTimeForInput(info.end));
    setTitleInput("");
    setDescriptionInput("");
    setColorInput(COLOR_PRESETS[0].value);
    setIsCreateOpen(true);
  };

  const handleEventClick = (info: EventClickInfo) => {
    const start = info.event.start;
    const end = info.event.end;
    const isTask = !!info.event.extendedProps.isTask;
    const eventColor =
      info.event.extendedProps.color ||
      info.event.backgroundColor ||
      COLOR_PRESETS[0].value;

    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      color: eventColor,
      start,
      end,
      isTask,
      priority: info.event.extendedProps.priority,
      status: info.event.extendedProps.status,
    });

    setEditTitle(info.event.title.replace(/^✓\s|^📋\s/, ""));
    setEditDescription(info.event.extendedProps.description || "");
    setEditColor(eventColor);
    setEditStartTime(start ? clampTimeForInput(start) : "09:00");
    setEditEndTime(end ? clampTimeForInput(end) : "10:00");
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
      // Якщо бекенд підтримує колір, він збережеться, або ж зберігатиметься локально
      ...({ color: colorInput } as Record<string, unknown>),
    });

    if (newEvent) {
      setLocalEvents((prev) => [
        ...prev,
        { ...newEvent, ...({ color: colorInput } as Record<string, unknown>) },
      ]);
    }
    setIsPending(false);
    setIsCreateOpen(false);
    setSelectedDates(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle.trim() || selectedEvent.isTask) return;

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

    setLocalEvents((prev) => {
      const existing = activeEvents.find((e) => e.id === selectedEvent.id);
      if (!existing) return prev;

      return [
        ...prev.filter((item) => item.id !== selectedEvent.id),
        {
          ...existing,
          title: editTitle.trim(),
          description: editDescription.trim(),
          startDate: baseStart,
          endDate: baseEnd,
          updatedAt: new Date(),
          ...({ color: editColor } as Record<string, unknown>),
        },
      ];
    });

    setIsPending(false);
    setIsEditing(false);
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.isTask) return;

    setIsPending(true);
    await deleteCalendarEvent(selectedEvent.id);
    setDeletedEventIds((prev) => [...prev, selectedEvent.id]);
    setLocalEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
    setIsPending(false);
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const formattedEvents = useMemo(() => {
    const regularEvents = activeEvents.map((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const eventColor =
        (event as unknown as { color?: string }).color ||
        COLOR_PRESETS[0].value;
      const matchedPreset = COLOR_PRESETS.find((p) => p.value === eventColor);

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        backgroundColor: eventColor,
        borderColor: matchedPreset ? matchedPreset.border : eventColor,
        extendedProps: {
          description: event.description,
          color: eventColor,
          isTask: false,
        },
        allDay:
          start.getHours() === 0 &&
          start.getMinutes() === 0 &&
          end.getHours() === 0 &&
          end.getMinutes() === 0 &&
          start.toDateString() === end.toDateString(),
      };
    });

    const taskEvents = initialTasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const dueDate = new Date(task.dueDate!);
        const isDone = task.status === "DONE";

        return {
          id: `task-${task.id}`,
          title: `${isDone ? "✓ " : "📋 "}${task.title}`,
          start: dueDate,
          end: dueDate,
          allDay: true,
          backgroundColor: isDone
            ? "#10b981"
            : task.priority === "HIGH"
              ? "#ef4444"
              : "#f59e0b",
          borderColor: isDone
            ? "#059669"
            : task.priority === "HIGH"
              ? "#dc2626"
              : "#d97706",
          extendedProps: {
            description: task.description,
            isTask: true,
            priority: task.priority,
            status: task.status,
          },
        };
      });

    return [...regularEvents, ...taskEvents];
  }, [activeEvents, initialTasks]);

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
        locale: "en",
        initialView: "timeGridDay",
        firstDay: 1,
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth",
        },
        buttonText: {
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        },
        scrollTime: new Date().toTimeString().slice(0, 8),
        scrollTimeReset: false,
        height: "75vh",
        dayHeaderFormat: {
          weekday: "short",
          day: "numeric",
          month: "short",
        },
        slotMinTime: "07:00:00",
        slotMaxTime: "20:00:00",
        slotDuration: "00:30:00",
        slotLabelInterval: "00:30:00",
        slotLabelFormat: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        eventTimeFormat: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        nowIndicator: true,
        allDaySlot: true,
        allDayText: "All Day",
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
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
    const startDateStr = start.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const startTimeStr = start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = end
      ? end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "";

    if (startTimeStr === "00:00" && (!endTimeStr || endTimeStr === "00:00")) {
      return startDateStr;
    }

    return `${startDateStr}, ${startTimeStr} ${endTimeStr ? `- ${endTimeStr}` : ""}`;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Legend + New Event */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Events
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Task Deadline
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Urgent Task (HIGH)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Completed Task
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          New Event
        </button>
      </div>

      <div ref={calendarRef} />

      {/* Create Event Modal */}
      {isCreateOpen && selectedDates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: colorInput }}
                >
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  New Event
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
                {selectedDates.start.toLocaleDateString("en-US", {
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
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Team Standup"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Color Tag
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColorInput(preset.value)}
                      style={{ backgroundColor: preset.value }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all transform cursor-pointer ${
                        colorInput === preset.value
                          ? "ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      title={preset.name}
                    >
                      {colorInput === preset.value && (
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Start (07:00 - 20:00)
                  </label>
                  <select
                    id="startTime"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={`start-${slot}`} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    End (07:00 - 20:00)
                  </label>
                  <select
                    id="endTime"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={`end-${slot}`} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  rows={3}
                  placeholder="Add details, link or location..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!titleInput.trim() || isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Edit Event Modal */}
      {isDetailOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  {!selectedEvent.isTask && (
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs"
                      style={{
                        backgroundColor: isEditing
                          ? editColor
                          : selectedEvent.color || COLOR_PRESETS[0].value,
                      }}
                    />
                  )}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {isEditing ? "Edit Event" : selectedEvent.title}
                  </h2>
                  {selectedEvent.isTask && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      Task
                    </span>
                  )}
                </div>

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

            {selectedEvent.isTask ? (
              <div className="mt-4 space-y-3">
                {selectedEvent.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    {selectedEvent.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No description provided
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>
                    Status:{" "}
                    <strong className="text-gray-700 dark:text-gray-300">
                      {selectedEvent.status}
                    </strong>
                  </span>
                  <span>
                    Priority:{" "}
                    <strong className="text-gray-700 dark:text-gray-300">
                      {selectedEvent.priority}
                    </strong>
                  </span>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : isEditing ? (
              <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="editTitle"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                {/* Edit Color Picker */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Color Tag
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setEditColor(preset.value)}
                        style={{ backgroundColor: preset.value }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all transform cursor-pointer ${
                          editColor === preset.value
                            ? "ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm"
                            : "opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                        title={preset.name}
                      >
                        {editColor === preset.value && (
                          <Check className="w-3.5 h-3.5 stroke-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="editStartTime"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                    >
                      Start (07:00 - 20:00)
                    </label>
                    <select
                      id="editStartTime"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={`edit-start-${slot}`} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="editEndTime"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                    >
                      End (07:00 - 20:00)
                    </label>
                    <select
                      id="editEndTime"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={`edit-end-${slot}`} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="editDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
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
                    Save
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
                    No description provided
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
                    Delete
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-600 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 className="mr-1.5 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Close
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
