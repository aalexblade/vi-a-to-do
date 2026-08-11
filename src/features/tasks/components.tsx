"use client";

import React, { useState, useTransition } from "react";
import { Task, TaskStatus, TaskPriority } from "./types";
import { createTask, updateTask, updateTaskStatus, deleteTask } from "./actions";
import { Loader2, Plus, Trash2, Edit3, X, Calendar, AlertCircle } from "lucide-react";

interface CreateTaskFormProps {
  onClose?: () => void;
}

export function CreateTaskForm({ onClose }: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = titleInput.trim();
    const description = (formData.get("description") as string) || "";
    const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";

    if (title && dueDateInput) {
      startTransition(async () => {
        await createTask({
          title,
          description,
          priority,
          dueDate: new Date(dueDateInput),
        });
        form.reset();
        setTitleInput("");
        setDueDateInput("");
        setIsOpen(false);
        if (onClose) onClose();
      });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setTitleInput("");
    setDueDateInput("");
    if (onClose) onClose();
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create Task
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                  autoFocus
                  placeholder="Task title..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Task details..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!titleInput.trim() || !dueDateInput || isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [prevInitialTasks, setPrevInitialTasks] = useState<Task[]>(initialTasks);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync state with incoming props during render (React 19 pattern)
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

  const handleUpdateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string).trim();
    const description = (formData.get("description") as string) || "";
    const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";
    const status = (formData.get("status") as TaskStatus) || "TODO";
    const dueDateStr = formData.get("dueDate") as string;

    if (title && dueDateStr) {
      startTransition(async () => {
        const updated = await updateTask({
          id: editingTask.id,
          title,
          description,
          priority,
          status,
          dueDate: new Date(dueDateStr),
        });

        if (updated) {
          setTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? (updated as unknown as Task) : t))
          );
        }
        setEditingTask(null);
      });
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            MEDIUM
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-sm italic py-4">No tasks found.</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm hover:shadow-md transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                  {task.title}
                </h3>
                {getPriorityBadge(task.priority)}
              </div>
              {task.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
              )}
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Due: {new Date(task.dueDate).toLocaleDateString("uk-UA")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(task.id, e.target.value as TaskStatus)
                }
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>

              <button
                onClick={() => setEditingTask(task)}
                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleDelete(task.id)}
                disabled={isPending}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Task
              </h2>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingTask.title}
                  required
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description || ""}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingTask.status}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={
                    editingTask.dueDate
                      ? new Date(editingTask.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  required
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}