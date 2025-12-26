import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import NotesPage from './modules/notes/NotesPage';
import PokemonPage from './modules/pokemon/PokemonPage';
import AiChatPage from './modules/ai-chat/AiChatPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import Layout from './components/Layout';

function App(): React.JSX.Element {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/pokemon" element={<PokemonPage />} />
          <Route path="/ai" element={<AiChatPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;