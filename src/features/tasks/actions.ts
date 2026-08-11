"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from "./types";

/**
 * Fetch all tasks ordered by creation date
 */
export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks.map((t) => ({
      ...t,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
    }));
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskInput) {
  try {
    const createData: Prisma.TaskCreateInput = {
      title: data.title,
      description: data.description ?? "",
      priority: data.priority || "MEDIUM",
      status: "TODO",
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
    };

    const task = await prisma.task.create({
      data: createData,
    });

    revalidatePath("/tasks");
    return task;
  } catch (error) {
    console.error("Failed to create task:", error);
    return null;
  }
}

/**
 * Update an existing task's fields
 */
export async function updateTask(data: UpdateTaskInput) {
  try {
    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const task = await prisma.task.update({
      where: { id: data.id },
      data: updateData,
    });

    revalidatePath("/tasks");
    return task;
  } catch (error) {
    console.error("Failed to update task:", error);
    return null;
  }
}

/**
 * Toggle or update task status
 */
export async function updateTaskStatus(id: string, status: TaskStatus) {
  try {
    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/tasks");
    return task;
  } catch (error) {
    console.error("Failed to update task status:", error);
    return null;
  }
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id },
    });

    revalidatePath("/tasks");
    return true;
  } catch (error) {
    console.error("Failed to delete task:", error);
    return false;
  }
}