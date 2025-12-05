
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Send, MessageSquare } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
  onUserChat: (message: string) => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, onUserChat }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onUserChat(chatInput);
    setChatInput('');
  };

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'combat': return 'text-red-400';
      case 'loot': return 'text-amber-400';
      case 'danger': return 'text-red-600 font-bold';
      case 'gain': return 'text-emerald-400';
      case 'story': return 'text-purple-300 italic font-serif tracking-wide';
      case 'info': default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-700 rounded-md overflow-hidden">
      <div className="bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold flex justify-between items-center">
        <span>Adventure Log</span>
        <MessageSquare size={12} />
      </div>
      
      {/* Log Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-slate-900 to-slate-950">
        {logs.map((log) => (
          <div key={log.id} className={`${getColor(log.type)} break-words leading-relaxed text-sm animate-in fade-in duration-300 slide-in-from-left-2`}>
            {log.type !== 'story' && (
              <span className="opacity-30 text-[10px] mr-2 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}
              </span>
            )}
            {log.type === 'story' && <span className="text-purple-500 mr-2">✦</span>}
            {log.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-800 bg-slate-900">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask the narrator or take action..."
            className="w-full bg-slate-800 border border-slate-700 rounded pl-3 pr-10 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button 
            type="submit" 
            className="absolute right-1 top-1 p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogPanel;
