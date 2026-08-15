import { getCalendarEvents } from "@/features/calendar/actions";
import { getTasks } from "@/features/tasks/actions";
import { CalendarView } from "@/features/calendar/components";

export const revalidate = 0;

export default async function CalendarPage() {
  const [events, tasks] = await Promise.all([
    getCalendarEvents(),
    getTasks(),
  ]);

  // Convert Date objects to ISO strings for serialization, then back in client component
  const serializedEvents = events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }));

  const parsedEvents = serializedEvents.map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  }));

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-4xl font-bold">My Calendar</h1>
      <CalendarView
        events={parsedEvents}
        tasks={tasks}
      />
    </div>
  );
}