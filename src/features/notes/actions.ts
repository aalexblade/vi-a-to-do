"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Отримує єдину головну нотатку-аркуш.
 * Якщо нотаток ще немає — автоматично створює перший документ.
 */
export async function getSingleNote() {
  try {
    let note = await prisma.note.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!note) {
      note = await prisma.note.create({
        data: {
          title: "Головна нотатка",
          content: "",
        },
      });
    }

    return note;
  } catch (error) {
    console.error("Failed to fetch single note:", error);
    return null;
  }
}

/**
 * Оновлює вміст єдиного аркуша (використовується для автозбереження)
 */
export async function updateSingleNote(id: string, content: string) {
  try {
    const note = await prisma.note.update({
      where: { id },
      data: {
        content,
      },
    });

    revalidatePath("/notes");
    revalidatePath("/");
    return note;
  } catch (error) {
    console.error("Failed to update single note:", error);
    return null;
  }
}

/**
 * Отримання всіх нотаток (для віджетів дашборду)
 */
export async function getNotes() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return notes;
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return [];
  }
}