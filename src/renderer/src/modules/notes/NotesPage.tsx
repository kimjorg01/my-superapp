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
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* LEFT: List */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Ideas</h2>
          <button 
            onClick={handleNewNote}
            className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition backdrop-blur-sm"
          >
            + New Note
          </button>
        </div>
        
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {notes.map((note) => (
            <div 
              key={note.id} 
              onClick={() => handleSelectNote(note)}
              className={`p-4 rounded-xl cursor-pointer group relative transition-all duration-200 border
                ${selectedNoteId === note.id 
                  ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
            >
              <h3 className={`font-bold mb-1 ${selectedNoteId === note.id ? 'text-indigo-300' : 'text-white'}`}>
                {note.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">{note.content}</p>
              <button 
                onClick={(e) => handleDelete(e, note.id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete note"
              >
                ✕
              </button>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
              <p className="text-gray-400 italic">No notes yet.</p>
              <p className="text-gray-600 text-sm mt-1">Create one to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Editor */}
      <div className="w-2/3 bento-card p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative gradient blob inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <input 
          type="text" 
          placeholder="Note Title..." 
          className="text-4xl font-bold bg-transparent border-none focus:outline-none text-white placeholder-gray-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea 
          placeholder="Write your thoughts here..." 
          className="flex-1 resize-none text-lg text-gray-300 bg-transparent border-none focus:outline-none placeholder-gray-600 leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          {selectedNoteId && (
            <button 
              onClick={handleNewNote}
              className="text-gray-400 px-4 py-2 hover:text-white transition"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleSave}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-2.5 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 font-medium"
          >
            {selectedNoteId ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
