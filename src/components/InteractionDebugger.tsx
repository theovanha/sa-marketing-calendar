'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Circle, Square, Download, Trash2, Bug } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'drag-start' | 'drag-over' | 'drag-leave' | 'drag-end' | 'drop' | 'state-change' | 'click' | 'error';
  message: string;
  details?: Record<string, any>;
}

// Global log store
let globalLogs: LogEntry[] = [];
let logId = 0;
let listeners: Set<() => void> = new Set();

export function debugLog(
  type: LogEntry['type'],
  message: string,
  details?: Record<string, any>
) {
  const entry: LogEntry = {
    id: logId++,
    timestamp: new Date().toISOString().split('T')[1].slice(0, 12),
    type,
    message,
    details,
  };
  globalLogs.push(entry);
  // Keep last 100 entries
  if (globalLogs.length > 100) {
    globalLogs = globalLogs.slice(-100);
  }
  // Notify listeners
  listeners.forEach(fn => fn());
}

export function clearDebugLogs() {
  globalLogs = [];
  logId = 0;
  listeners.forEach(fn => fn());
}

export function exportDebugLogs(): string {
  return JSON.stringify(globalLogs, null, 2);
}

export function InteractionDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  // Subscribe to log updates
  useEffect(() => {
    const updateLogs = () => setLogs([...globalLogs]);
    listeners.add(updateLogs);
    return () => {
      listeners.delete(updateLogs);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    const container = document.getElementById('debug-log-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  const handleExport = () => {
    const data = exportDebugLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const data = exportDebugLogs();
    navigator.clipboard.writeText(data).then(() => {
      alert('Debug log copied to clipboard! Paste it in the chat.');
    });
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => l.type === filter);

  const typeColors: Record<string, string> = {
    'drag-start': 'text-green-400',
    'drag-over': 'text-blue-400',
    'drag-leave': 'text-yellow-400',
    'drag-end': 'text-orange-400',
    'drop': 'text-purple-400',
    'state-change': 'text-cyan-400',
    'click': 'text-pink-400',
    'error': 'text-red-400',
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[100] p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-colors"
        title="Open Interaction Debugger"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[500px] max-h-[70vh] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-white text-sm">Interaction Debugger</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
              <Circle className="w-2 h-2 fill-current" /> REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-1.5 rounded transition-colors ${
              isRecording ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <Square className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="p-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
            title="Copy to Clipboard (paste in chat)"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={() => clearDebugLogs()}
            className="p-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-850 border-b border-gray-700 overflow-x-auto">
        {['all', 'drag-start', 'drag-over', 'drop', 'state-change', 'error'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-[10px] rounded whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="px-3 py-2 bg-blue-900/30 border-b border-gray-700 text-xs text-blue-300">
        <strong>How to use:</strong> Try extending/shortening an event, then click the download button 
        and paste the log in chat so I can see what's happening.
      </div>

      {/* Logs */}
      <div 
        id="debug-log-container"
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px] min-h-[200px] max-h-[400px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No logs yet. Interact with the calendar to see events.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2 hover:bg-gray-800/50 rounded px-1">
              <span className="text-gray-500 shrink-0">{log.timestamp}</span>
              <span className={`shrink-0 ${typeColors[log.type] || 'text-gray-400'}`}>
                [{log.type}]
              </span>
              <span className="text-gray-200">{log.message}</span>
              {log.details && (
                <span className="text-gray-500 truncate" title={JSON.stringify(log.details)}>
                  {JSON.stringify(log.details)}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700 text-[10px] text-gray-400 flex justify-between">
        <span>{logs.length} entries</span>
        <span>Showing: {filter}</span>
      </div>
    </div>
  );
}

