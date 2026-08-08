"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Edit, Loader2, Save } from "lucide-react";
import { Note, CreateNoteDTO } from "./types";
import { createNote, updateNote, deleteNote } from "./actions";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateNote(note.id, { title, content });
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteNote(note.id);
    });
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString();

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold text-foreground focus:border-primary focus:ring-primary"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground focus:border-primary focus:ring-primary"
            required
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex justify-center rounded-md border border-transparent bg-muted px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted-foreground hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
            <span>{formattedDate}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-muted-foreground hover:text-red-500 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateNoteForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: CreateNoteDTO = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    };

    startTransition(async () => {
      await createNote(data);
      event.currentTarget.reset(); // Clear form after submission
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Create New Note</h2>
      <div>
        <label htmlFor="note-title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          type="text"
          id="note-title"
          name="title"
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="note-content" className="block text-sm font-medium text-foreground">
          Content
        </label>
        <textarea
          id="note-content"
          name="content"
          rows={5}
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Note
        </button>
      </div>
    </form>
  );
}

interface NoteGridProps {
  notes: Note[];
}

export function NoteGrid({ notes }: NoteGridProps) {
  if (!notes || notes.length === 0) {
    return <p className="text-muted-foreground">No notes found. Start by creating one!</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
