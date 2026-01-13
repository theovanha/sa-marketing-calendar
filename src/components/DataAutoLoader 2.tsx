'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, useGlobalEvents } from '@/lib/store';
import { loadSADataset } from '@/lib/dataLoader';

/**
 * Auto-loads SA dataset and syncs with Supabase on app startup.
 */
export function DataAutoLoader() {
  const { 
    importGlobalEvents, 
    selectedYear, 
    initializeFromSupabase,
    isInitialized 
  } = useAppStore();
  const globalEvents = useGlobalEvents();
  const hasLoadedSAData = useRef(false);
  const hasInitializedSupabase = useRef(false);

  // Initialize from Supabase on mount
  useEffect(() => {
    if (hasInitializedSupabase.current) return;
    hasInitializedSupabase.current = true;
    
    initializeFromSupabase().catch(console.error);
  }, [initializeFromSupabase]);

  // Load SA dataset after Supabase init
  useEffect(() => {
    if (!isInitialized) return;
    if (hasLoadedSAData.current) return;
    
    // Check if we already have global events for the current year
    const hasEventsForYear = globalEvents.some((e) => 
      e.startDate.startsWith(String(selectedYear))
    );
    
    if (hasEventsForYear) {
      hasLoadedSAData.current = true;
      return;
    }

    // Load SA dataset
    const loadData = async () => {
      hasLoadedSAData.current = true;
      
      // Load current year
      const { events: currentYearEvents } = await loadSADataset(selectedYear);
      
      // Also load next year if we're in Q4
      const currentMonth = new Date().getMonth();
      let allEvents = [...currentYearEvents];
      
      if (currentMonth >= 9) { // October onwards
        const { events: nextYearEvents } = await loadSADataset(selectedYear + 1);
        allEvents = [...allEvents, ...nextYearEvents];
      }
      
      if (allEvents.length > 0) {
        importGlobalEvents(allEvents);
        console.log(`[DataAutoLoader] Loaded ${allEvents.length} SA events`);
      }
    };

    loadData();
  }, [isInitialized, selectedYear, globalEvents, importGlobalEvents]);

  // This component doesn't render anything
  return null;
}
