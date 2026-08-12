export type { Note } from "@/types";

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
}