import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [specs, setSpecs] = useState<any>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setTime(new Date()), 60000);
    
    // Fetch specs
    // @ts-ignore
    window.api.getSystemSpecs().then(setSpecs);

    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{greeting}, Kim</h1>
          <p className="text-gray-400 text-lg">Here is what's happening in your SuperApp today.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono text-indigo-400 font-bold">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        
        {/* Quick Actions Card */}
        <div className="bento-card p-6 col-span-1 md:col-span-2 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="flex gap-4">
              <Link to="/notes" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-2">
                <span>📝</span> New Note
              </Link>
              <Link to="/ai" className="px-6 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-2">
                <span>🤖</span> Ask AI Assistant
              </Link>
              <Link to="/pokemon" className="px-6 py-3 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 transition-all flex items-center gap-2">
                <span>🐲</span> View Collection
              </Link>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bento-card p-6 flex flex-col relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Status
          </h3>
          
          {specs ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">CPU</div>
                <div className="text-sm text-white font-mono truncate" title={specs.cpuModel}>{specs.cpuModel}</div>
                <div className="text-xs text-gray-400">{specs.cpuCores} Cores</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Memory</div>
                  <div className="text-xl font-bold text-white">{specs.totalMem} GB</div>
                  <div className="text-xs text-gray-400">{specs.freeMem} GB Free</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Platform</div>
                  <div className="text-xl font-bold text-white capitalize">{specs.platform}</div>
                  <div className="text-xs text-gray-400">{specs.hostname}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading specs...
            </div>
          )}
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bento-card p-6 col-span-1 md:col-span-3">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <div className="text-white font-bold">Project Ideas</div>
                <div className="text-sm text-gray-400">Edited 2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-2xl">
                🐲
              </div>
              <div>
                <div className="text-white font-bold">Pokemon Collection</div>
                <div className="text-sm text-gray-400">Added Charizard (Base Set)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
