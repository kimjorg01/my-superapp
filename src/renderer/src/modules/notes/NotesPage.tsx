import { useState, useEffect } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Load notes on startup
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    // @ts-ignore
    const data = await window.api.getNotes();
    setNotes(data);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!title || !content) return;
    
    try {
      if (selectedNoteId) {
        // Update existing note
        // @ts-ignore
        await window.api.updateNote({ id: selectedNoteId, title, content });
      } else {
        // Create new note
        // @ts-ignore
        await window.api.createNote({ title, content });
      }
      
      handleNewNote(); // Reset form
      fetchNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent selecting the note when clicking delete
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        // @ts-ignore
        await window.api.deleteNote(id);
        if (selectedNoteId === id) {
          handleNewNote();
        }
        fetchNotes();
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  return (
    <div className="flex h-full">
      {/* LEFT: List */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">My Ideas</h2>
          <button 
            onClick={handleNewNote}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition"
          >
            + New
          </button>
        </div>
        
        <div className="space-y-2 flex-1">
          {notes.map((note) => (
            <div 
              key={note.id} 
              onClick={() => handleSelectNote(note)}
              className={`p-3 rounded shadow-sm border cursor-pointer group relative transition
                ${selectedNoteId === note.id 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                  : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
            >
              <h3 className={`font-bold ${selectedNoteId === note.id ? 'text-blue-700' : 'text-gray-800'}`}>
                {note.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">{note.content}</p>
              <button 
                onClick={(e) => handleDelete(e, note.id)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete note"
              >
                ×
              </button>
            </div>
          ))}
          {notes.length === 0 && <p className="text-gray-400 text-sm italic text-center mt-10">No notes yet.</p>}
        </div>
      </div>

      {/* RIGHT: Editor */}
      <div className="w-2/3 p-6 flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Note Title..." 
          className="text-3xl font-bold border-b border-gray-200 focus:outline-none pb-2 bg-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea 
          placeholder="Write your thoughts here..." 
          className="flex-1 resize-none text-lg text-gray-600 focus:outline-none bg-transparent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          {selectedNoteId && (
            <button 
              onClick={handleNewNote}
              className="text-gray-500 px-4 py-2 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition shadow-sm"
          >
            {selectedNoteId ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}