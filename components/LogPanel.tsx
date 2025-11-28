import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'combat': return 'text-red-400';
      case 'loot': return 'text-amber-400';
      case 'danger': return 'text-red-600 font-bold';
      case 'gain': return 'text-emerald-400';
      case 'info': default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-700 rounded-md overflow-hidden">
      <div className="bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold">
        System Log
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
        {logs.map((log) => (
          <div key={log.id} className={`${getColor(log.type)} break-words leading-tight`}>
            <span className="opacity-50 text-xs mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
            {log.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default LogPanel;