"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateNoteDTO } from "./types";

export async function getNotes() {
  const notes = await prisma.note.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return notes;
}

export async function createNote(data: CreateNoteDTO) {
  await prisma.note.create({ data });
  revalidatePath("/notes");
}

export async function updateNote(id: string, data: Partial<CreateNoteDTO>) {
  await prisma.note.update({
    where: { id },
    data,
  });
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  await prisma.note.delete({
    where: { id },
  });
  revalidatePath("/notes");
}
