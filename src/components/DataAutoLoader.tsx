'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, useGlobalEvents, useSelectedBrand } from '@/lib/store';
import { loadMultiCountryDataset } from '@/lib/dataLoader';
import { CountryCode } from '@/lib/types';

/**
 * Auto-loads country datasets based on selected brand's countries.
 * Syncs with Supabase on app startup.
 */
export function DataAutoLoader() {
  const { 
    importGlobalEvents, 
    clearGlobalEvents,
    selectedYear, 
    initializeFromSupabase,
    isInitialized 
  } = useAppStore();
  const selectedBrand = useSelectedBrand();
  const globalEvents = useGlobalEvents();
  const hasInitializedSupabase = useRef(false);
  const lastLoadedCountries = useRef<string>('');
  const lastLoadedYear = useRef<number>(0);

  // Initialize from Supabase on mount
  useEffect(() => {
    if (hasInitializedSupabase.current) return;
    hasInitializedSupabase.current = true;
    
    initializeFromSupabase().catch(console.error);
  }, [initializeFromSupabase]);

  // Load country datasets after Supabase init, when brand or year changes
  useEffect(() => {
    if (!isInitialized) return;
    
    // Get countries from selected brand, or default to 'za'
    const countries: CountryCode[] = selectedBrand?.countries || ['za'];
    const countriesKey = countries.sort().join(',');
    
    // Skip if already loaded for same countries and year
    if (countriesKey === lastLoadedCountries.current && selectedYear === lastLoadedYear.current) {
      return;
    }

    // Load country datasets
    const loadData = async () => {
      lastLoadedCountries.current = countriesKey;
      lastLoadedYear.current = selectedYear;
      
      // Clear existing global events before loading new ones
      clearGlobalEvents();
      
      // Load current year for all selected countries
      const { events: currentYearEvents } = await loadMultiCountryDataset(countries, selectedYear);
      
      // Also load next year if we're in Q4
      const currentMonth = new Date().getMonth();
      let allEvents = [...currentYearEvents];
      
      if (currentMonth >= 9) { // October onwards
        const { events: nextYearEvents } = await loadMultiCountryDataset(countries, selectedYear + 1);
        allEvents = [...allEvents, ...nextYearEvents];
      }
      
      if (allEvents.length > 0) {
        importGlobalEvents(allEvents);
        console.log(`[DataAutoLoader] Loaded ${allEvents.length} events for countries: ${countriesKey}`);
      }
    };

    loadData();
  }, [isInitialized, selectedYear, selectedBrand?.countries, importGlobalEvents, clearGlobalEvents]);

  // This component doesn't render anything
  return null;
}
