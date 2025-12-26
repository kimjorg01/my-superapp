import React from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen text-white overflow-hidden">
      {/* Glassmorphism Sidebar */}
      <aside className="w-64 glass-panel flex flex-col p-6 z-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-lg">
            S
          </div>
          <h1 className="text-xl font-bold tracking-tight">SuperApp</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem to="/" icon="🏠" label="Dashboard" />
          <NavItem to="/notes" icon="📝" label="Notes" />
          <NavItem to="/pokemon" icon="🐲" label="Pokemon" />
          <NavItem to="/ai" icon="🤖" label="AI Chat" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
              US
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">User</span>
              <span className="text-xs text-gray-400">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[100px]" />
        </div>

        <div className="p-8 w-full h-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-500/30'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`
    }
  >
    <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default Layout;
