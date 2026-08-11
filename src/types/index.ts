export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";


interface BaseTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface Task extends BaseTask {
  id: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO extends BaseTask {
  dueDate: string; // dueDate will be a string from form input
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNoteDTO = Omit<Note, "id" | "createdAt" | "updatedAt">;

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCalendarEventDTO = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
