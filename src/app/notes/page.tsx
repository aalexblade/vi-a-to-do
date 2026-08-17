import { getSingleNote } from "@/features/notes/actions";
import { SingleNoteDocument } from "@/features/notes/components";

export const revalidate = 0;

export default async function NotesPage() {
  const note = await getSingleNote();

  if (!note) {
    return (
      <div className="p-8 text-center text-gray-500">
        Failed to load the notes document.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Notes
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your single continuous workspace for thoughts, drafts, and quick notes
        </p>
      </div>

      <SingleNoteDocument initialNote={note} />
    </div>
  );
}