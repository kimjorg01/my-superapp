import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
}

const MODELS = [
  "gpt-oss:20b",
  "gemma3:27b",
  "qwen3:8b",
  "qwen3-coder:30b"
];

export default function AiChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    // @ts-ignore
    const data = await window.api.getChatSessions();
    setSessions(data);
  };

  const loadMessages = async (id: number) => {
    // @ts-ignore
    const data = await window.api.getChatMessages(id);
    setMessages(data);
  };

  const handleNewChat = async () => {
    // @ts-ignore
    const newSession = await window.api.createChatSession('New Chat');
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      // @ts-ignore
      await window.api.deleteChatSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      // @ts-ignore
      const newSession = await window.api.createChatSession(input.substring(0, 30) + '...');
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // @ts-ignore
      const response = await window.api.askAi(userMessage, selectedModel, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to AI." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      {/* LEFT: History Sidebar */}
      <div className="w-64 flex flex-col gap-4">
        <button 
          onClick={handleNewChat}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          <span>+</span> New Chat
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`p-3 rounded-lg cursor-pointer group relative transition-all border ${
                currentSessionId === session.id 
                  ? 'bg-white/10 border-white/10 text-white' 
                  : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <div className="truncate pr-6 text-sm font-medium">{session.title}</div>
              <button 
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Chat Area */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-sm text-white outline-none focus:border-indigo-500"
            >
              {MODELS.map(m => <option key={m} value={m} className="text-black">{m}</option>)}
            </select>
          </div>
          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Ollama Online
          </div>
        </div>

        <div className="flex-1 bento-card p-6 flex flex-col relative overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <span className="text-4xl">🤖</span>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">How can I help you today?</h3>
                <p className="text-gray-400 max-w-md">
                  I have access to your Notes and Pokemon collection. Ask me anything!
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white/10 text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex gap-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}