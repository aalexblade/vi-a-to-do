"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CalendarEvent, CreateCalendarEventDTO } from "./types";

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const events = await prisma.calendarEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return events as unknown as CalendarEvent[];
}

export async function createCalendarEvent(
  data: CreateCalendarEventDTO
): Promise<CalendarEvent> {
  const newEvent = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      description: data.description || "",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  revalidatePath("/calendar");
  return newEvent as unknown as CalendarEvent;
}

export async function updateCalendarEventDates(
  id: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  await prisma.calendarEvent.update({
    where: { id },
    data: { startDate, endDate },
  });
  revalidatePath("/calendar");
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await prisma.calendarEvent.delete({
    where: { id },
  });
  revalidatePath("/calendar");
}