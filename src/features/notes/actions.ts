"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateNoteInput, UpdateNoteInput } from "./types";

/**
 * Fetch all notes ordered by creation date
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

/**
 * Create a new note
 */
export async function createNote(data: CreateNoteInput) {
  try {
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
      },
    });

    revalidatePath("/notes");
    return note;
  } catch (error) {
    console.error("Failed to create note:", error);
    return null;
  }
}

/**
 * Update an existing note
 */
export async function updateNote(data: UpdateNoteInput) {
  try {
    const note = await prisma.note.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
      },
    });

    revalidatePath("/notes");
    return note;
  } catch (error) {
    console.error("Failed to update note:", error);
    return null;
  }
}

/**
 * Delete a note by ID
 */
export async function deleteNote(id: string) {
  try {
    await prisma.note.delete({
      where: { id },
    });

    revalidatePath("/notes");
    return true;
  } catch (error) {
    console.error("Failed to delete note:", error);
    return false;
  }
}