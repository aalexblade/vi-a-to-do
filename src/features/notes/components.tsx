"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  Loader2,
  Check,
  Copy,
  Download,
  Trash2,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Bold,
  Italic,
  Underline,
  Clock,
} from "lucide-react";
import { Note } from "./types";
import { updateSingleNote } from "./actions";

interface SingleNoteDocumentProps {
  initialNote: Note;
}

export function SingleNoteDocument({ initialNote }: SingleNoteDocumentProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [copied, setCopied] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [isPending, startTransition] = useTransition();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Update statistics (word & char count)
  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const cleanText = text.replace(/\n/g, " ").trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = cleanText.length;
    setStats({ words, chars });
  };

  // Perform server action save
  const performSave = (htmlContent: string) => {
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await updateSingleNote(initialNote.id, htmlContent);
      if (result) {
        setSaveStatus("saved");
        setLastSavedAt(
          new Date().toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } else {
        setSaveStatus("unsaved");
      }
    });
  };

  // Trigger autosave on user typing
  const handleInput = () => {
    updateStats();
    setSaveStatus("unsaved");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        performSave(editorRef.current.innerHTML);
      }
    }, 800);
  };

  // Set initial content on mount
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = initialNote.content || "";
      updateStats();
      isInitialMount.current = false;
    }
  }, [initialNote.content]);

  // Execute rich text commands (bold, italic, headings, lists)
  const execFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Copy plain text content to clipboard
  const handleCopy = async () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Download note as HTML document
  const handleDownload = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML || "";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `note-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear sheet content
  const handleClear = () => {
    if (!editorRef.current) return;
    if (confirm("Очистити весь аркуш?")) {
      editorRef.current.innerHTML = "";
      handleInput();
    }
  };

  const readingTime = Math.max(1, Math.ceil(stats.words / 200));

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden flex flex-col min-h-[82vh]">
      {/* Top Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/70 select-none">
        {/* Rich text formatting actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("formatBlock", "<h1>");
            }}
            title="Великий заголовок (H1)"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("formatBlock", "<h2>");
            }}
            title="Середній заголовок (H2)"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("bold");
            }}
            title="Жирний (Ctrl+B)"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("italic");
            }}
            title="Курсив (Ctrl+I)"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("underline");
            }}
            title="Підкреслений (Ctrl+U)"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("insertUnorderedList");
            }}
            title="Маркований список"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("insertOrderedList");
            }}
            title="Нумерований список"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Right utility buttons & Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium pr-2 border-r border-gray-300">
            {saveStatus === "saving" || isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span className="text-blue-600">Збереження...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Збережено</span>
              </>
            ) : (
              <span className="text-amber-600 font-medium">
                Незбережені зміни
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Скопіювати весь текст"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Скопійовано" : "Копіювати"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Завантажити як документ"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Завантажити</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            title="Очистити аркуш"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Word-Like Editable Canvas */}
      <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Почніть писати тут як у Word..."
          className="min-h-[60vh] w-full text-base sm:text-lg leading-relaxed text-gray-900 focus:outline-none 
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:mt-2
            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-2
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
            [&_b]:font-bold [&_strong]:font-bold
            [&_i]:italic [&_em]:italic
            [&_u]:underline
            empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 select-none">
        <div className="flex items-center gap-4">
          <span>
            Слів:{" "}
            <strong className="text-gray-700 font-semibold">
              {stats.words}
            </strong>
          </span>
          <span>
            Символів:{" "}
            <strong className="text-gray-700 font-semibold">
              {stats.chars}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{readingTime} хв читання
          </span>
        </div>

        <div>
          {lastSavedAt
            ? `Останнє збереження: ${lastSavedAt}`
            : "Автозбереження активне"}
        </div>
      </div>
    </div>
  );
}
