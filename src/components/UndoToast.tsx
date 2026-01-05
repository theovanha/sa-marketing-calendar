'use client';

import { useAppStore } from '@/lib/store';
import { Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UndoToast() {
  const { showUndoToast, deletedEvents, undoDelete, dismissUndoToast } = useAppStore();
  
  const lastDeleted = deletedEvents[0];
  
  if (!showUndoToast || !lastDeleted) return null;
  
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded',
        'bg-surface-900 border border-surface-700 shadow-2xl shadow-black/80',
        'animate-in'
      )}
    >
      <span className="text-sm text-surface-400">
        Deleted <span className="font-medium text-white">"{lastDeleted.title}"</span>
      </span>
      
      <button
        onClick={undoDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-black text-sm font-semibold transition-colors"
        style={{ backgroundColor: '#00F59B' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#33FDB5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00F59B'}
      >
        <Undo2 className="w-4 h-4" />
        Undo
      </button>
      
      <button
        onClick={dismissUndoToast}
        className="p-1 rounded text-surface-500 hover:text-white hover:bg-surface-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

