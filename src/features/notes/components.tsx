"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Loader2, Check, Cloud, Save } from "lucide-react";
import { Note } from "./types";
import { updateSingleNote } from "./actions";

interface SingleNoteDocumentProps {
  initialNote: Note;
}

export function SingleNoteDocument({ initialNote }: SingleNoteDocumentProps) {
  const [content, setContent] = useState(initialNote.content || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isPending, startTransition] = useTransition();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const performSave = (textToSave: string) => {
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await updateSingleNote(initialNote.id, textToSave);
      if (result) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    });
  };

  // Auto-save logic with debounce (1000ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(content);
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Keyboard shortcut Ctrl+S / Cmd+S for instant manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        performSave(content);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Top Document Status Bar */}
      <div className="flex items-center justify-between px-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4 text-xs">
          <span>
            Words: <strong className="text-gray-700 dark:text-gray-200">{wordCount}</strong>
          </span>
          <span>
            Characters: <strong className="text-gray-700 dark:text-gray-200">{charCount}</strong>
          </span>
          <span className="hidden sm:inline text-gray-400">• Ctrl + S to save manually</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" || isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">Saving...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">All changes saved</span>
              </>
            ) : (
              <>
                <Cloud className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => performSave(content)}
            disabled={saveStatus === "saved" || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            Save now
          </button>
        </div>
      </div>

      {/* Main Single Document Sheet */}
      <div className="min-h-[75vh] w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 sm:p-12 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your thoughts here like on a clean sheet of paper..."
          className="h-full min-h-[65vh] w-full resize-none border-none bg-transparent p-0 text-base leading-relaxed text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}