import { getNotes } from "@/features/notes/actions";
import { CreateNoteForm, NoteGrid } from "@/features/notes/components";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-4xl font-bold">My Notes</h1>
      <CreateNoteForm />
      <NoteGrid notes={notes} />
    </div>
  );
}
