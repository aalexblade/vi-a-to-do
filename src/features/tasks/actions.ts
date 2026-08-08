"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateTaskDTO, TaskStatus, TaskPriority } from "./types";

export async function getTasks() {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks.map(t => ({
    ...t,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    dueDate: t.dueDate, // Ensure dueDate is a Date object from Prisma
  }));
}

export async function createTask(data: CreateTaskDTO) {
  await prisma.task.create({ data: {
    ...data,
    dueDate: new Date(data.dueDate), // Ensure dueDate is a Date object
    // Default values for status and priority are handled by Prisma schema
  } });
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  await prisma.task.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });
  revalidatePath("/tasks");
}
