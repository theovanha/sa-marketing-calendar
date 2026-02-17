'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ErrorToast() {
  const { syncError } = useAppStore();
  
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (syncError) {
      const timer = setTimeout(() => {
        useAppStore.setState({ syncError: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncError]);
  
  if (!syncError) return null;
  
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded',
        'bg-red-900/90 border border-red-700 shadow-2xl shadow-black/80',
        'animate-in'
      )}
    >
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <span className="text-sm text-red-100">{syncError}</span>
      
      <button
        onClick={() => useAppStore.setState({ syncError: null })}
        className="p-1 rounded text-red-400 hover:text-white hover:bg-red-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
