"use client";

import React, { useState, useTransition } from "react";
import { Task, TaskStatus, TaskPriority } from "./types";
import { createTask, updateTaskStatus, deleteTask } from "./actions";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CreateTaskFormProps {
  onClose?: () => void;
}

export function CreateTaskForm({ onClose }: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";
    const dueDateStr = formData.get("dueDate") as string;

    if (title && dueDateStr) {
      startTransition(async () => {
        await createTask({
          title,
          description,
          priority,
          dueDate: dueDateStr,
          status: "TODO" as TaskStatus,
        });
        form.reset();
        setIsOpen(false);
        if (onClose) onClose();
      });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-4 border rounded-lg bg-card space-y-4 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              required
              className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                name="priority"
                className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Due Date</label>
              <input
                type="date"
                name="dueDate"
                required
                className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [prevInitialTasks, setPrevInitialTasks] =
    useState<Task[]>(initialTasks);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Синхронізація стану під час рендеру без ефектів (React 19 pattern)
  if (prevInitialTasks !== initialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => {
      await updateTaskStatus(id, status);
    });
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await deleteTask(id);
    });
  };

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No tasks found.</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm"
          >
            <div>
              <h3 className="font-semibold text-base">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-gray-500">{task.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(task.id, e.target.value as TaskStatus)
                }
                className="text-xs border rounded p-1 bg-background"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
              <button
                onClick={() => handleDelete(task.id)}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 p-1 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
