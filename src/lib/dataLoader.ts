import type { CalendarEvent } from './types';
import type {
  PublicHolidaysFile,
  SchoolCalendarFile,
  CulturalMomentsFile,
  SeasonsFile,
} from './schemas';
import {
  validatePublicHolidays,
  validateSchoolCalendar,
  validateCulturalMoments,
  validateSeasons,
} from './schemas';

// ============================================
// SA Dataset Loader
// Converts JSON dataset files into CalendarEvent objects
// ============================================

// Convert public holidays to CalendarEvents
export function convertPublicHolidays(data: PublicHolidaysFile): CalendarEvent[] {
  return data.holidays.map((holiday, index) => ({
    id: `za-holiday-${data.year}-${index}`,
    brandId: null, // Global events
    title: holiday.title,
    type: 'publicHoliday',
    startDate: holiday.startDate,
    endDate: holiday.endDate,
    tags: holiday.tags || [],
    importance: holiday.importance || 'high',
    visibility: 'client',
    notes: holiday.notes,
  }));
}

// Convert school calendar to CalendarEvents
// Only creates single-day markers for term starts and holiday starts
export function convertSchoolCalendar(data: SchoolCalendarFile): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  data.terms.forEach((term, index) => {
    // Add term START marker
    events.push({
      id: `za-term-start-${data.year}-${term.term}`,
      brandId: null,
      title: `📚 Term ${term.term} Starts`,
      type: 'backToSchool',
      startDate: term.startDate,
      tags: ['school', 'back-to-school', 'retail'],
      importance: 'high',
      visibility: 'client',
      notes: 'School term begins. Key retail moment for school supplies, uniforms, and stationery.',
    });

    // Add school HOLIDAY start marker (day after term ends)
    // Calculate the next day after term ends as holiday start
    const termEndDate = new Date(term.endDate);
    const holidayStart = new Date(termEndDate);
    holidayStart.setDate(holidayStart.getDate() + 1);
    const holidayStartStr = holidayStart.toISOString().split('T')[0];

    // Don't add holiday after Term 4 (it's just summer/festive)
    if (term.term < 4) {
      events.push({
        id: `za-school-holiday-${data.year}-${term.term}`,
        brandId: null,
        title: `🏖️ School Holiday Starts`,
        type: 'schoolTerm',
        startDate: holidayStartStr,
        tags: ['school', 'holiday', 'travel', 'family'],
        importance: 'med',
        visibility: 'client',
        notes: `School holidays begin after Term ${term.term}. Family travel and activities peak.`,
      });
    }
  });

  return events;
}

// Convert cultural moments to CalendarEvents
export function convertCulturalMoments(data: CulturalMomentsFile): CalendarEvent[] {
  return data.moments.map((moment, index) => ({
    id: `za-culture-${data.year}-${index}`,
    brandId: null,
    title: moment.title,
    type: 'culture',
    startDate: moment.startDate,
    endDate: moment.endDate,
    tags: moment.tags || [],
    importance: moment.importance || 'med',
    visibility: 'client',
    notes: moment.notes,
  }));
}

// Convert seasons to CalendarEvents for a specific year
// Only creates single-day markers for the START of each season
export function convertSeasons(data: SeasonsFile, year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  data.seasons.forEach((season, index) => {
    // Parse MM-DD format for start date
    const [startMonth, startDay] = season.startDate.split('-').map(Number);

    // Handle year - Summer starts in December of the previous display year
    // But we want to show it in the year the user is viewing
    let startYear = year;
    
    // For Summer which starts Dec 1, show it in December of the selected year
    // (it will also appear as the start of summer for next year's view)
    if (season.name === 'Summer' && startMonth === 12) {
      startYear = year;
    }

    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

    // Skip "Festive" as it overlaps with Summer and Christmas
    if (season.name === 'Festive') return;

    // Create a friendly title
    const seasonTitles: Record<string, string> = {
      'Summer': '☀️ Summer Begins',
      'Autumn': '🍂 Autumn Begins',
      'Winter': '❄️ Winter Begins',
      'Spring': '🌸 Spring Day',
    };

    events.push({
      id: `za-season-start-${year}-${index}`,
      brandId: null,
      title: seasonTitles[season.name] || `${season.name} Begins`,
      type: 'season',
      startDate,
      // No endDate - single day event
      tags: ['season', season.name.toLowerCase()],
      importance: 'low',
      visibility: 'client',
      notes: season.notes,
    });
  });

  return events;
}

// Load all SA data for a specific year
export async function loadSADataset(year: number): Promise<{
  events: CalendarEvent[];
  errors: string[];
}> {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];

  try {
    // Load public holidays
    const holidaysResponse = await fetch(`/data/za/publicHolidays/${year}.json`);
    if (holidaysResponse.ok) {
      const holidaysData = await holidaysResponse.json();
      const validation = validatePublicHolidays(holidaysData);
      if (validation.valid && validation.data) {
        events.push(...convertPublicHolidays(validation.data));
      } else {
        errors.push(`Public holidays: ${validation.errors?.map((e) => e.message).join(', ')}`);
      }
    } else {
      errors.push(`Public holidays file not found for ${year}`);
    }
  } catch (e) {
    errors.push(`Failed to load public holidays: ${e}`);
  }

  try {
    // Load school calendar
    const schoolResponse = await fetch(`/data/za/schoolCalendar/${year}.json`);
    if (schoolResponse.ok) {
      const schoolData = await schoolResponse.json();
      const validation = validateSchoolCalendar(schoolData);
      if (validation.valid && validation.data) {
        events.push(...convertSchoolCalendar(validation.data));
      } else {
        errors.push(`School calendar: ${validation.errors?.map((e) => e.message).join(', ')}`);
      }
    } else {
      errors.push(`School calendar file not found for ${year}`);
    }
  } catch (e) {
    errors.push(`Failed to load school calendar: ${e}`);
  }

  try {
    // Load cultural moments
    const cultureResponse = await fetch(`/data/za/culturalMoments/${year}.json`);
    if (cultureResponse.ok) {
      const cultureData = await cultureResponse.json();
      const validation = validateCulturalMoments(cultureData);
      if (validation.valid && validation.data) {
        events.push(...convertCulturalMoments(validation.data));
      } else {
        errors.push(`Cultural moments: ${validation.errors?.map((e) => e.message).join(', ')}`);
      }
    } else {
      // Cultural moments are optional
      console.log(`Cultural moments file not found for ${year}`);
    }
  } catch (e) {
    errors.push(`Failed to load cultural moments: ${e}`);
  }

  try {
    // Load seasons (evergreen)
    const seasonsResponse = await fetch('/data/za/seasons.json');
    if (seasonsResponse.ok) {
      const seasonsData = await seasonsResponse.json();
      const validation = validateSeasons(seasonsData);
      if (validation.valid && validation.data) {
        events.push(...convertSeasons(validation.data, year));
      } else {
        errors.push(`Seasons: ${validation.errors?.map((e) => e.message).join(', ')}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to load seasons: ${e}`);
  }

  return { events, errors };
}

// Check if dataset exists for a year
export async function checkDatasetExists(year: number): Promise<{
  holidays: boolean;
  school: boolean;
  culture: boolean;
  seasons: boolean;
}> {
  const results = await Promise.all([
    fetch(`/data/za/publicHolidays/${year}.json`).then((r) => r.ok).catch(() => false),
    fetch(`/data/za/schoolCalendar/${year}.json`).then((r) => r.ok).catch(() => false),
    fetch(`/data/za/culturalMoments/${year}.json`).then((r) => r.ok).catch(() => false),
    fetch('/data/za/seasons.json').then((r) => r.ok).catch(() => false),
  ]);

  return {
    holidays: results[0],
    school: results[1],
    culture: results[2],
    seasons: results[3],
  };
}

