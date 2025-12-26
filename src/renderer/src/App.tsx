import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NotesPage from './modules/notes/NotesPage';
import PokemonPage from './modules/pokemon/PokemonPage';
import AiChatPage from './modules/ai-chat/AiChatPage';

function App(): React.JSX.Element {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
        {/* SIDEBAR SHELL */}
        <nav className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-4">
          <h1 className="text-xl font-bold mb-6">My Superapp</h1>
          
          <Link to="/" className="p-2 hover:bg-gray-800 rounded transition">
            📝 Notes
          </Link>
          <Link to="/pokemon" className="p-2 hover:bg-gray-800 rounded transition">
            🐲 Pokemon
          </Link>
          <Link to="/ai" className="p-2 hover:bg-gray-800 rounded transition">
            🤖 AI Chat
          </Link>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto bg-white shadow-inner m-4 rounded-lg border border-gray-200">
          <Routes>
            <Route path="/" element={<NotesPage />} />
            <Route path="/pokemon" element={<PokemonPage />} />
            <Route path="/ai" element={<AiChatPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;