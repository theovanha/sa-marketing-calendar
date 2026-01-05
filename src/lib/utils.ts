import { clsx, type ClassValue } from 'clsx';
import {
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameMonth,
  getMonth,
  getYear,
  addYears,
} from 'date-fns';
import type { CalendarEvent, EventType, EVENT_TYPE_PRIORITY } from './types';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Generate a unique ID
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Date utilities
export function formatDate(dateStr: string, formatStr: string = 'MMM d'): string {
  return format(parseISO(dateStr), formatStr);
}

export function formatDateRange(startDate: string, endDate?: string): string {
  if (!endDate || startDate === endDate) {
    return formatDate(startDate, 'MMM d, yyyy');
  }
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (getYear(start) === getYear(end)) {
    if (getMonth(start) === getMonth(end)) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

// Check if an event intersects with a given month
export function eventIntersectsMonth(event: CalendarEvent, year: number, month: number): boolean {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  
  const eventStart = parseISO(event.startDate);
  const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
  
  // Check if event range overlaps with month range
  return (
    isWithinInterval(eventStart, { start: monthStart, end: monthEnd }) ||
    isWithinInterval(eventEnd, { start: monthStart, end: monthEnd }) ||
    (eventStart <= monthStart && eventEnd >= monthEnd)
  );
}

// Get events for a specific month
export function getEventsForMonth(
  events: CalendarEvent[],
  year: number,
  month: number
): CalendarEvent[] {
  return events.filter((event) => eventIntersectsMonth(event, year, month));
}

// Sort events by type priority, then by date
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  const priorities: Record<EventType, number> = {
    publicHoliday: 0,
    backToSchool: 1,
    schoolTerm: 2,
    brandMoment: 3,
    campaignFlight: 4,
    culture: 5,
    season: 6,
  };
  
  return [...events].sort((a, b) => {
    const priorityDiff = priorities[a.type] - priorities[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return a.startDate.localeCompare(b.startDate);
  });
}

// Materialize recurring events for a given year
export function materializeRecurringEvents(
  events: CalendarEvent[],
  targetYear: number
): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  
  for (const event of events) {
    if (event.recurrence?.freq === 'yearly') {
      const eventYear = getYear(parseISO(event.startDate));
      if (eventYear !== targetYear) {
        // Create a virtual copy for the target year
        const yearDiff = targetYear - eventYear;
        const newStartDate = format(addYears(parseISO(event.startDate), yearDiff), 'yyyy-MM-dd');
        const newEndDate = event.endDate
          ? format(addYears(parseISO(event.endDate), yearDiff), 'yyyy-MM-dd')
          : undefined;
        
        result.push({
          ...event,
          id: `${event.id}-${targetYear}`,
          startDate: newStartDate,
          endDate: newEndDate,
        });
      } else {
        result.push(event);
      }
    } else {
      // Non-recurring: only include if it's in the target year
      const eventYear = getYear(parseISO(event.startDate));
      if (eventYear === targetYear) {
        result.push(event);
      }
    }
  }
  
  return result;
}

// Group events by month for the year view
export function groupEventsByMonth(
  events: CalendarEvent[],
  year: number
): Map<number, CalendarEvent[]> {
  const monthMap = new Map<number, CalendarEvent[]>();
  
  for (let month = 0; month < 12; month++) {
    const monthEvents = getEventsForMonth(events, year, month);
    monthMap.set(month, sortEvents(monthEvents));
  }
  
  return monthMap;
}

// Filter events based on filter state (simplified)
export function filterEvents(
  events: CalendarEvent[],
  filters: {
    keyDates: boolean;       // Public holidays + cultural moments
    school: boolean;         // School terms + back-to-school
    seasons: boolean;        // Seasonal markers
    brandDates: boolean;     // User brand moments
    campaignFlights: boolean; // User campaigns
  }
): CalendarEvent[] {
  return events.filter((event) => {
    switch (event.type) {
      case 'publicHoliday':
      case 'culture':
        return filters.keyDates;
      case 'schoolTerm':
      case 'backToSchool':
        return filters.school;
      case 'season':
        return filters.seasons;
      case 'brandMoment':
        return filters.brandDates;
      case 'campaignFlight':
        return filters.campaignFlights;
      default:
        return true;
    }
  });
}

// Search events by title, tags, and notes
export function searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
  if (!query.trim()) return events;
  
  const lowerQuery = query.toLowerCase();
  return events.filter((event) => {
    return (
      event.title.toLowerCase().includes(lowerQuery) ||
      event.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      event.notes?.toLowerCase().includes(lowerQuery)
    );
  });
}

// Get quarter number (1-4) from month (0-11)
export function getQuarter(month: number): number {
  return Math.floor(month / 3) + 1;
}

// Get month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec',
];

// Color palette for brands (grey is default)
export const BRAND_COLORS = [
  '#6b7280', // grey (default)
  '#00F59B', // VANHA green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#ef4444', // red
  '#84cc16', // lime
];

export function getNextBrandColor(existingColors: string[]): string {
  for (const color of BRAND_COLORS) {
    if (!existingColors.includes(color)) {
      return color;
    }
  }
  return BRAND_COLORS[existingColors.length % BRAND_COLORS.length];
}
