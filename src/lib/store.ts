'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Brand, CalendarEvent, FilterState } from './types';
import { generateId, getNextBrandColor } from './utils';

// ============================================
// App Store - Brands, Events, UI State
// ============================================

interface AppState {
  // Data
  brands: Brand[];
  events: CalendarEvent[];
  monthNotes: Record<string, string>; // Key: "brandId-year-month", Value: note text
  hiddenEventsByBrand: Record<string, string[]>; // Key: brandId, Value: array of hidden event IDs
  
  // Undo stack (stores recently deleted events)
  deletedEvents: CalendarEvent[];
  lastHiddenEventBrandId: string | null; // Track which brand the last hidden event was for
  showUndoToast: boolean;
  
  // UI State
  selectedBrandId: string | null;
  selectedYear: number;
  selectedEventId: string | null;
  drawerOpen: boolean;
  drawerMode: 'view' | 'add' | 'edit';
  searchQuery: string;
  filters: FilterState;
  
  // Brand Actions
  createBrand: (name: string) => Brand;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  archiveBrand: (id: string) => void;
  deleteBrand: (id: string) => void;
  selectBrand: (id: string | null) => void;
  
  // Event Actions
  createEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  hideEventForBrand: (eventId: string, brandId: string) => void;
  unhideEventForBrand: (eventId: string, brandId: string) => void;
  isEventHiddenForBrand: (eventId: string, brandId: string) => boolean;
  selectEvent: (id: string | null) => void;
  
  // Undo Actions
  undoDelete: () => void;
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
  setMonthNote: (brandId: string | null, year: number, month: number, note: string) => void;
  getMonthNote: (brandId: string | null, year: number, month: number) => string;
}

const DEFAULT_FILTERS: FilterState = {
  keyDates: true,        // Public holidays + cultural moments
  school: true,          // School terms + back-to-school
  seasons: true,         // Seasonal markers
  brandDates: true,      // User brand moments
  campaignFlights: true, // User campaigns
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      brands: [],
      events: [],
      monthNotes: {},
      hiddenEventsByBrand: {},
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
      
      // Brand Actions
      createBrand: (name: string) => {
        const newBrand: Brand = {
          id: generateId(),
          name,
          primaryColor: '#6b7280', // Always default to grey
          timezone: 'Africa/Johannesburg',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          brands: [...state.brands, newBrand],
        }));
        return newBrand;
      },
      
      updateBrand: (id, updates) => {
        set((state) => ({
          brands: state.brands.map((brand) =>
            brand.id === id ? { ...brand, ...updates } : brand
          ),
        }));
      },
      
      archiveBrand: (id) => {
        set((state) => ({
          brands: state.brands.map((brand) =>
            brand.id === id ? { ...brand, archived: true } : brand
          ),
          selectedBrandId: state.selectedBrandId === id ? null : state.selectedBrandId,
        }));
      },
      
      deleteBrand: (id) => {
        set((state) => ({
          brands: state.brands.filter((brand) => brand.id !== id),
          events: state.events.filter((event) => event.brandId !== id),
          selectedBrandId: state.selectedBrandId === id ? null : state.selectedBrandId,
        }));
      },
      
      selectBrand: (id) => {
        set({ selectedBrandId: id, selectedEventId: null, drawerOpen: false });
      },
      
      // Event Actions
      createEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: generateId(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        return newEvent;
      },
      
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },
      
      deleteEvent: (id) => {
        const eventToDelete = get().events.find((e) => e.id === id);
        const currentBrandId = get().selectedBrandId;
        
        // If it's a global event (brandId is null), hide it for this brand instead of deleting
        if (eventToDelete && eventToDelete.brandId === null && currentBrandId) {
          get().hideEventForBrand(id, currentBrandId);
          set((state) => ({
            deletedEvents: [eventToDelete, ...state.deletedEvents].slice(0, 10),
            lastHiddenEventBrandId: currentBrandId,
            showUndoToast: true,
          }));
        } else {
          // It's a brand-specific event, actually delete it
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
            selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
            deletedEvents: eventToDelete 
              ? [eventToDelete, ...state.deletedEvents].slice(0, 10)
              : state.deletedEvents,
            lastHiddenEventBrandId: null,
            showUndoToast: !!eventToDelete,
          }));
        }
        
        // Auto-hide toast after 5 seconds
        if (eventToDelete) {
          setTimeout(() => {
            set({ showUndoToast: false });
          }, 5000);
        }
      },
      
      hideEventForBrand: (eventId, brandId) => {
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
      },
      
      unhideEventForBrand: (eventId, brandId) => {
        set((state) => {
          const currentHidden = state.hiddenEventsByBrand[brandId] || [];
          return {
            hiddenEventsByBrand: {
              ...state.hiddenEventsByBrand,
              [brandId]: currentHidden.filter((id) => id !== eventId),
            },
          };
        });
      },
      
      isEventHiddenForBrand: (eventId, brandId) => {
        const hiddenEvents = get().hiddenEventsByBrand[brandId] || [];
        return hiddenEvents.includes(eventId);
      },
      
      selectEvent: (id) => {
        set({ selectedEventId: id });
      },
      
      // Undo Actions
      undoDelete: () => {
        const [lastDeleted, ...rest] = get().deletedEvents;
        const lastHiddenBrandId = get().lastHiddenEventBrandId;
        
        if (lastDeleted) {
          // If this was a hidden global event, unhide it
          if (lastDeleted.brandId === null && lastHiddenBrandId) {
            get().unhideEventForBrand(lastDeleted.id, lastHiddenBrandId);
            set({
              deletedEvents: rest,
              lastHiddenEventBrandId: null,
              showUndoToast: false,
            });
          } else {
            // It was an actual deletion, restore the event
            set((state) => ({
              events: [...state.events, lastDeleted],
              deletedEvents: rest,
              lastHiddenEventBrandId: null,
              showUndoToast: false,
            }));
          }
        }
      },
      
      dismissUndoToast: () => {
        set({ showUndoToast: false });
      },
      
      // Bulk event operations
      importGlobalEvents: (newEvents) => {
        set((state) => {
          // Remove existing global events and add new ones
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
      setMonthNote: (brandId, year, month, note) => {
        const key = `${brandId || 'global'}-${year}-${month}`;
        set((state) => ({
          monthNotes: {
            ...state.monthNotes,
            [key]: note,
          },
        }));
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
    // Include brand-specific events for this brand
    if (e.brandId === brandId) return true;
    // Include global events that aren't hidden for this brand
    if (e.brandId === null && !hiddenIds.includes(e.id)) return true;
    return false;
  });
};

export const useGlobalEvents = () => {
  const { events } = useAppStore();
  return events.filter((e) => e.brandId === null);
};
