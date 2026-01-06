'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, useGlobalEvents } from '@/lib/store';
import { loadSADataset } from '@/lib/dataLoader';

/**
 * Auto-loads SA dataset (public holidays, school terms, cultural moments, seasons)
 * on app startup. Runs once per session.
 */
export function DataAutoLoader() {
  const { importGlobalEvents, selectedYear } = useAppStore();
  const globalEvents = useGlobalEvents();
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Only load once per session, and only if no global events exist
    if (hasLoaded.current) return;
    
    // Check if we already have global events for the current year
    const hasEventsForYear = globalEvents.some((e) => 
      e.startDate.startsWith(String(selectedYear))
    );
    
    if (hasEventsForYear) {
      hasLoaded.current = true;
      return;
    }

    // Load SA dataset
    const loadData = async () => {
      hasLoaded.current = true;
      
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
  }, [selectedYear, globalEvents, importGlobalEvents]);

  // This component doesn't render anything
  return null;
}



