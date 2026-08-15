import Link from "next/link";
import { getCalendarEvents } from "@/features/calendar/actions";
import { getTasks } from "@/features/tasks/actions";
import { getNotes } from "@/features/notes/actions";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const [events, tasks, notes] = await Promise.all([
    getCalendarEvents(),
    getTasks(),
    getNotes(),
  ]);

  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const urgentTasks = activeTasks
    .filter((t) => t.priority === "HIGH" || t.priority === "MEDIUM")
    .slice(0, 4);

  const upcomingEvents = events
    .filter(
      (e) => new Date(e.startDate) >= new Date(new Date().setHours(0, 0, 0, 0)),
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .slice(0, 4);

  const recentNotes = notes.slice(0, 4);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Дашборд
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Зведення ваших подій, задач та нотаток
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Активні задачі
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activeTasks.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Майбутні події
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {upcomingEvents.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Всього нотаток
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {notes.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Tasks & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Пріоритетні задачі
              </h2>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Всі задачі <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {urgentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-6 text-center">
              Немає термінових задач.
            </p>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/40 flex items-center justify-between"
                >
                  <div className="space-y-1 pr-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      Дедлайн:{" "}
                      {new Date(task.dueDate).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                      task.priority === "HIGH"
                        ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Найближчі події
              </h2>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Календар <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-6 text-center">
              Немає запланованих подій.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/40 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {event.title}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "short",
                        })}
                        {", "}
                        {new Date(event.startDate).toLocaleTimeString("uk-UA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes */}
      <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Останні нотатки
            </h2>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Всі нотатки <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-6 text-center">
            Нотаток ще немає.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/40 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {note.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                  {new Date(note.createdAt).toLocaleDateString("uk-UA")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
