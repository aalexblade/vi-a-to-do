"use client";

import dynamic from "next/dynamic";
import { CalendarEvent } from "./types";
import { Task } from "@/types";

const FullCalendarInternal = dynamic(
  () => import("./FullCalendarInternal"),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border">
        Loading calendar...
      </div>
    ),
  }
);

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks?: Task[];
}

export function CalendarView({ events, tasks = [] }: CalendarViewProps) {
  return <FullCalendarInternal initialEvents={events} initialTasks={tasks} />;
}