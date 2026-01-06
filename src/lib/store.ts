'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Brand, CalendarEvent, FilterState } from './types';
import { generateId } from './utils';
import { 
  brandService, 
  eventService, 
  hiddenEventService, 
  monthNoteService,
  loadAllData 
} from './supabaseService';

// ============================================
// App Store - Brands, Events, UI State
// With Supabase Sync
// ============================================

interface AppState {
  // Data
  brands: Brand[];
  events: CalendarEvent[];
  monthNotes: Record<string, string>;
  hiddenEventsByBrand: Record<string, string[]>;
  
  // Sync state
  isLoading: boolean;
  isInitialized: boolean;
  syncError: string | null;
  
  // Undo stack
  deletedEvents: CalendarEvent[];
  lastHiddenEventBrandId: string | null;
  showUndoToast: boolean;
  
  // UI State
  selectedBrandId: string | null;
  selectedYear: number;
  selectedEventId: string | null;
  drawerOpen: boolean;
  drawerMode: 'view' | 'add' | 'edit';
  searchQuery: string;
  filters: FilterState;
  
  // Initialization
  initializeFromSupabase: () => Promise<void>;
  
  // Brand Actions
  createBrand: (name: string) => Promise<Brand>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>;
  archiveBrand: (id: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  selectBrand: (id: string | null) => void;
  
  // Event Actions
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  hideEventForBrand: (eventId: string, brandId: string) => Promise<void>;
  unhideEventForBrand: (eventId: string, brandId: string) => Promise<void>;
  isEventHiddenForBrand: (eventId: string, brandId: string) => boolean;
  selectEvent: (id: string | null) => void;
  
  // Undo Actions
  undoDelete: () => Promise<void>;
  dismissUndoToast: () => void;
  
  // Bulk event operations (for dataset import)
  importGlobalEvents: (events: CalendarEvent[]) => void;
  clearGlobalEvents: () => void;
  
  // UI Actions
  setSelectedYear: (year: number) => void;
  openDrawer: (mode: 'view' | 'add' | 'edit', eventId?: string) => void;
  closeDrawer: () => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (filter: keyof FilterState) => void;
  resetFilters: () => void;
  
  // Month notes
  setMonthNote: (brandId: string | null, year: number, month: number, note: string) => Promise<void>;
  getMonthNote: (brandId: string | null, year: number, month: number) => string;
}

const DEFAULT_FILTERS: FilterState = {
  keyDates: true,
  school: true,
  seasons: true,
  brandDates: true,
  campaignFlights: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      brands: [],
      events: [],
      monthNotes: {},
      hiddenEventsByBrand: {},
      isLoading: false,
      isInitialized: false,
      syncError: null,
      deletedEvents: [],
      lastHiddenEventBrandId: null,
      showUndoToast: false,
      selectedBrandId: null,
      selectedYear: new Date().getFullYear(),
      selectedEventId: null,
      drawerOpen: false,
      drawerMode: 'add',
      searchQuery: '',
      filters: DEFAULT_FILTERS,
      
      // Initialize from Supabase
      initializeFromSupabase: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true, syncError: null });
        
        try {
          const data = await loadAllData();
          
          // Merge Supabase data with local events (keep global SA events from local)
          const localGlobalEvents = get().events.filter(e => e.brandId === null);
          const supabaseGlobalEvents = data.events.filter(e => e.brandId === null);
          const supabaseBrandEvents = data.events.filter(e => e.brandId !== null);
          
          // Use Supabase global events if they exist, otherwise keep local
          const globalEvents = supabaseGlobalEvents.length > 0 
            ? supabaseGlobalEvents 
            : localGlobalEvents;
          
          set({
            brands: data.brands,
            events: [...globalEvents, ...supabaseBrandEvents],
            hiddenEventsByBrand: data.hiddenEventsByBrand,
            monthNotes: data.monthNotes,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to load from Supabase:', error);
          set({ 
            isLoading: false, 
            isInitialized: true,
            syncError: 'Failed to connect to database. Using local data.' 
          });
        }
      },
      
      // Brand Actions
      createBrand: async (name: string) => {
        const newBrand: Brand = {
          id: generateId(),
          name,
          primaryColor: '#6b7280',
          timezone: 'Africa/Johannesburg',
          createdAt: new Date().toISOString(),
        };
        
        // Update local state immediately
        set((state) => ({
          brands: [...state.brands, newBrand],
        }));
        
        // Sync to Supabase
        try {
          await brandService.create(newBrand);
        } catch (error) {
          console.error('Failed to sync brand to Supabase:', error);
        }
        
        return newBrand;
      },
      
      updateBrand: async (id, updates) => {
        set((state) => ({
          brands: state.brands.map((brand) =>
            brand.id === id ? { ...brand, ...updates } : brand
          ),
        }));
        
        try {
          await brandService.update(id, updates);
        } catch (error) {
          console.error('Failed to sync brand update to Supabase:', error);
        }
      },
      
      archiveBrand: async (id) => {
        set((state) => ({
          brands: state.brands.map((brand) =>
            brand.id === id ? { ...brand, archived: true } : brand
          ),
          selectedBrandId: state.selectedBrandId === id ? null : state.selectedBrandId,
        }));
        
        try {
          await brandService.update(id, { archived: true });
        } catch (error) {
          console.error('Failed to sync brand archive to Supabase:', error);
        }
      },
      
      deleteBrand: async (id) => {
        set((state) => ({
          brands: state.brands.filter((brand) => brand.id !== id),
          events: state.events.filter((event) => event.brandId !== id),
          selectedBrandId: state.selectedBrandId === id ? null : state.selectedBrandId,
        }));
        
        try {
          await brandService.delete(id);
        } catch (error) {
          console.error('Failed to sync brand deletion to Supabase:', error);
        }
      },
      
      selectBrand: (id) => {
        set({ selectedBrandId: id, selectedEventId: null, drawerOpen: false });
      },
      
      // Event Actions
      createEvent: async (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: generateId(),
        };
        
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        
        // Only sync brand events to Supabase (not global SA events)
        if (newEvent.brandId !== null) {
          try {
            await eventService.create(newEvent);
          } catch (error) {
            console.error('Failed to sync event to Supabase:', error);
          }
        }
        
        return newEvent;
      },
      
      updateEvent: async (id, updates) => {
        const event = get().events.find(e => e.id === id);
        
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
        
        // Only sync brand events to Supabase
        if (event && event.brandId !== null) {
          try {
            await eventService.update(id, updates);
          } catch (error) {
            console.error('Failed to sync event update to Supabase:', error);
          }
        }
      },
      
      deleteEvent: async (id) => {
        const eventToDelete = get().events.find((e) => e.id === id);
        const currentBrandId = get().selectedBrandId;
        
        if (eventToDelete && eventToDelete.brandId === null && currentBrandId) {
          // Global event - hide it for this brand
          await get().hideEventForBrand(id, currentBrandId);
          set((state) => ({
            deletedEvents: [eventToDelete, ...state.deletedEvents].slice(0, 10),
            lastHiddenEventBrandId: currentBrandId,
            showUndoToast: true,
          }));
        } else {
          // Brand-specific event - actually delete it
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
            selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
            deletedEvents: eventToDelete 
              ? [eventToDelete, ...state.deletedEvents].slice(0, 10)
              : state.deletedEvents,
            lastHiddenEventBrandId: null,
            showUndoToast: !!eventToDelete,
          }));
          
          if (eventToDelete && eventToDelete.brandId !== null) {
            try {
              await eventService.delete(id);
            } catch (error) {
              console.error('Failed to sync event deletion to Supabase:', error);
            }
          }
        }
        
        if (eventToDelete) {
          setTimeout(() => {
            set({ showUndoToast: false });
          }, 5000);
        }
      },
      
      hideEventForBrand: async (eventId, brandId) => {
        set((state) => {
          const currentHidden = state.hiddenEventsByBrand[brandId] || [];
          if (currentHidden.includes(eventId)) return state;
          return {
            hiddenEventsByBrand: {
              ...state.hiddenEventsByBrand,
              [brandId]: [...currentHidden, eventId],
            },
          };
        });
        
        try {
          await hiddenEventService.hide(brandId, eventId);
        } catch (error) {
          console.error('Failed to sync hidden event to Supabase:', error);
        }
      },
      
      unhideEventForBrand: async (eventId, brandId) => {
        set((state) => {
          const currentHidden = state.hiddenEventsByBrand[brandId] || [];
          return {
            hiddenEventsByBrand: {
              ...state.hiddenEventsByBrand,
              [brandId]: currentHidden.filter((id) => id !== eventId),
            },
          };
        });
        
        try {
          await hiddenEventService.unhide(brandId, eventId);
        } catch (error) {
          console.error('Failed to sync unhidden event to Supabase:', error);
        }
      },
      
      isEventHiddenForBrand: (eventId, brandId) => {
        const hiddenEvents = get().hiddenEventsByBrand[brandId] || [];
        return hiddenEvents.includes(eventId);
      },
      
      selectEvent: (id) => {
        set({ selectedEventId: id });
      },
      
      // Undo Actions
      undoDelete: async () => {
        const [lastDeleted, ...rest] = get().deletedEvents;
        const lastHiddenBrandId = get().lastHiddenEventBrandId;
        
        if (lastDeleted) {
          if (lastDeleted.brandId === null && lastHiddenBrandId) {
            await get().unhideEventForBrand(lastDeleted.id, lastHiddenBrandId);
            set({
              deletedEvents: rest,
              lastHiddenEventBrandId: null,
              showUndoToast: false,
            });
          } else {
            set((state) => ({
              events: [...state.events, lastDeleted],
              deletedEvents: rest,
              lastHiddenEventBrandId: null,
              showUndoToast: false,
            }));
            
            if (lastDeleted.brandId !== null) {
              try {
                await eventService.create(lastDeleted);
              } catch (error) {
                console.error('Failed to restore event to Supabase:', error);
              }
            }
          }
        }
      },
      
      dismissUndoToast: () => {
        set({ showUndoToast: false });
      },
      
      // Bulk event operations (local only - for global SA data)
      importGlobalEvents: (newEvents) => {
        set((state) => {
          const brandEvents = state.events.filter((e) => e.brandId !== null);
          return {
            events: [...brandEvents, ...newEvents],
          };
        });
      },
      
      clearGlobalEvents: () => {
        set((state) => ({
          events: state.events.filter((e) => e.brandId !== null),
        }));
      },
      
      // UI Actions
      setSelectedYear: (year) => {
        set({ selectedYear: year });
      },
      
      openDrawer: (mode, eventId) => {
        set({
          drawerOpen: true,
          drawerMode: mode,
          selectedEventId: eventId || null,
        });
      },
      
      closeDrawer: () => {
        set({ drawerOpen: false, selectedEventId: null });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      toggleFilter: (filter) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [filter]: !state.filters[filter],
          },
        }));
      },
      
      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
      },
      
      // Month notes
      setMonthNote: async (brandId, year, month, note) => {
        const key = `${brandId || 'global'}-${year}-${month}`;
        set((state) => ({
          monthNotes: {
            ...state.monthNotes,
            [key]: note,
          },
        }));
        
        if (brandId) {
          try {
            await monthNoteService.set(brandId, year, month, note);
          } catch (error) {
            console.error('Failed to sync month note to Supabase:', error);
          }
        }
      },
      
      getMonthNote: (brandId, year, month) => {
        const key = `${brandId || 'global'}-${year}-${month}`;
        return get().monthNotes[key] || '';
      },
    }),
    {
      name: 'sa-marketing-calendar-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        brands: state.brands,
        events: state.events,
        monthNotes: state.monthNotes,
        hiddenEventsByBrand: state.hiddenEventsByBrand,
        selectedBrandId: state.selectedBrandId,
        selectedYear: state.selectedYear,
        filters: state.filters,
      }),
    }
  )
);

// Selectors
export const useSelectedBrand = () => {
  const { brands, selectedBrandId } = useAppStore();
  return brands.find((b) => b.id === selectedBrandId) || null;
};

export const useActiveBrands = () => {
  const { brands } = useAppStore();
  return brands.filter((b) => !b.archived);
};

export const useSelectedEvent = () => {
  const { events, selectedEventId } = useAppStore();
  return events.find((e) => e.id === selectedEventId) || null;
};

export const useBrandEvents = (brandId: string | null) => {
  const { events, hiddenEventsByBrand } = useAppStore();
  const hiddenIds = brandId ? (hiddenEventsByBrand[brandId] || []) : [];
  
  return events.filter((e) => {
    if (e.brandId === brandId) return true;
    if (e.brandId === null && !hiddenIds.includes(e.id)) return true;
    return false;
  });
};

export const useGlobalEvents = () => {
  const { events } = useAppStore();
  return events.filter((e) => e.brandId === null);
};
