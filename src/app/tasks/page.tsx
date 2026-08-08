import { getTasks } from "@/features/tasks/actions";
import { TaskList, CreateTaskForm } from "@/features/tasks/components";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold">My Tasks</h1>
      
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold">Create New Task</h2>
        <CreateTaskForm />
      </div>

      <TaskList initialTasks={tasks} />
    </div>
  );
}