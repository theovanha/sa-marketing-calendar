import type { CalendarEvent, CountryCode } from './types';
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
// Multi-Country Dataset Loader
// Converts JSON dataset files into CalendarEvent objects
// ============================================

// Convert public holidays to CalendarEvents
export function convertPublicHolidays(data: PublicHolidaysFile, countryCode: string): CalendarEvent[] {
  return data.holidays.map((holiday, index) => ({
    id: `${countryCode}-holiday-${data.year}-${index}`,
    brandId: null, // Global events
    title: holiday.title,
    type: 'publicHoliday',
    startDate: holiday.startDate,
    endDate: holiday.endDate,
    tags: [...(holiday.tags || []), countryCode],
    importance: holiday.importance || 'high',
    visibility: 'client',
    notes: holiday.notes,
  }));
}

// Convert sporting events to CalendarEvents (for global)
export function convertSportingEvents(data: CulturalMomentsFile, countryCode: string): CalendarEvent[] {
  return data.moments.map((moment, index) => ({
    id: `${countryCode}-sport-${data.year}-${index}`,
    brandId: null,
    title: moment.title,
    type: 'culture', // Use culture type for sporting events
    startDate: moment.startDate,
    endDate: moment.endDate,
    tags: [...(moment.tags || []), countryCode, 'sporting'],
    importance: moment.importance || 'high',
    visibility: 'client',
    notes: moment.notes,
  }));
}

// Convert school calendar to CalendarEvents
// Only creates single-day markers for term starts and holiday starts
export function convertSchoolCalendar(data: SchoolCalendarFile, countryCode: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  data.terms.forEach((term) => {
    // Add term START marker
    events.push({
      id: `${countryCode}-term-start-${data.year}-${term.term}`,
      brandId: null,
      title: `📚 Term ${term.term} Starts`,
      type: 'backToSchool',
      startDate: term.startDate,
      tags: ['school', 'back-to-school', 'retail', countryCode],
      importance: 'high',
      visibility: 'client',
      notes: 'School term begins. Key retail moment for school supplies, uniforms, and stationery.',
    });

    // Add school HOLIDAY start marker (day after term ends)
    const termEndDate = new Date(term.endDate);
    const holidayStart = new Date(termEndDate);
    holidayStart.setDate(holidayStart.getDate() + 1);
    const holidayStartStr = holidayStart.toISOString().split('T')[0];

    // Don't add holiday after Term 4 (it's just summer/festive)
    if (term.term < 4) {
      events.push({
        id: `${countryCode}-school-holiday-${data.year}-${term.term}`,
        brandId: null,
        title: `🏖️ School Holiday Starts`,
        type: 'schoolTerm',
        startDate: holidayStartStr,
        tags: ['school', 'holiday', 'travel', 'family', countryCode],
        importance: 'med',
        visibility: 'client',
        notes: `School holidays begin after Term ${term.term}. Family travel and activities peak.`,
      });
    }
  });

  return events;
}

// Convert cultural moments to CalendarEvents
export function convertCulturalMoments(data: CulturalMomentsFile, countryCode: string): CalendarEvent[] {
  return data.moments.map((moment, index) => ({
    id: `${countryCode}-culture-${data.year}-${index}`,
    brandId: null,
    title: moment.title,
    type: 'culture',
    startDate: moment.startDate,
    endDate: moment.endDate,
    tags: [...(moment.tags || []), countryCode],
    importance: moment.importance || 'med',
    visibility: 'client',
    notes: moment.notes,
  }));
}

// Convert seasons to CalendarEvents for a specific year
export function convertSeasons(data: SeasonsFile, year: number, countryCode: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  data.seasons.forEach((season, index) => {
    const [startMonth, startDay] = season.startDate.split('-').map(Number);
    let startYear = year;
    
    if (season.name === 'Summer' && startMonth === 12) {
      startYear = year;
    }

    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

    if (season.name === 'Festive') return;

    const seasonTitles: Record<string, string> = {
      'Summer': '☀️ Summer Begins',
      'Autumn': '🍂 Autumn Begins',
      'Winter': '❄️ Winter Begins',
      'Spring': '🌸 Spring Day',
    };

    events.push({
      id: `${countryCode}-season-start-${year}-${index}`,
      brandId: null,
      title: seasonTitles[season.name] || `${season.name} Begins`,
      type: 'season',
      startDate,
      tags: ['season', season.name.toLowerCase(), countryCode],
      importance: 'low',
      visibility: 'client',
      notes: season.notes,
    });
  });

  return events;
}

// Load data for a single country
export async function loadCountryData(countryCode: CountryCode, year: number): Promise<{
  events: CalendarEvent[];
  errors: string[];
}> {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];

  // Load public holidays (all countries have this)
  try {
    const holidaysResponse = await fetch(`/data/${countryCode}/publicHolidays/${year}.json`);
    if (holidaysResponse.ok) {
      const holidaysData = await holidaysResponse.json();
      const validation = validatePublicHolidays(holidaysData);
      if (validation.valid && validation.data) {
        events.push(...convertPublicHolidays(validation.data, countryCode));
      } else {
        errors.push(`${countryCode} public holidays: ${validation.errors?.map((e) => e.message).join(', ')}`);
      }
    }
  } catch (e) {
    // Silently skip if file doesn't exist
    console.log(`No public holidays for ${countryCode}/${year}`);
  }

  // Load sporting events (global only)
  if (countryCode === 'global') {
    try {
      const sportResponse = await fetch(`/data/${countryCode}/sportingEvents/${year}.json`);
      if (sportResponse.ok) {
        const sportData = await sportResponse.json();
        const validation = validateCulturalMoments(sportData);
        if (validation.valid && validation.data) {
          events.push(...convertSportingEvents(validation.data, countryCode));
        }
      }
    } catch (e) {
      console.log(`No sporting events for ${year}`);
    }
  }

  // Load school calendar (only za has this currently)
  if (countryCode === 'za') {
    try {
      const schoolResponse = await fetch(`/data/${countryCode}/schoolCalendar/${year}.json`);
      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json();
        const validation = validateSchoolCalendar(schoolData);
        if (validation.valid && validation.data) {
          events.push(...convertSchoolCalendar(validation.data, countryCode));
        }
      }
    } catch (e) {
      console.log(`No school calendar for ${countryCode}/${year}`);
    }
  }

  // Load cultural moments
  try {
    const cultureResponse = await fetch(`/data/${countryCode}/culturalMoments/${year}.json`);
    if (cultureResponse.ok) {
      const cultureData = await cultureResponse.json();
      const validation = validateCulturalMoments(cultureData);
      if (validation.valid && validation.data) {
        events.push(...convertCulturalMoments(validation.data, countryCode));
      }
    }
  } catch (e) {
    console.log(`No cultural moments for ${countryCode}/${year}`);
  }

  // Load seasons (only za has this currently)
  if (countryCode === 'za') {
    try {
      const seasonsResponse = await fetch(`/data/${countryCode}/seasons.json`);
      if (seasonsResponse.ok) {
        const seasonsData = await seasonsResponse.json();
        const validation = validateSeasons(seasonsData);
        if (validation.valid && validation.data) {
          events.push(...convertSeasons(validation.data, year, countryCode));
        }
      }
    } catch (e) {
      console.log(`No seasons for ${countryCode}`);
    }
  }

  return { events, errors };
}

// Load data for multiple countries
export async function loadMultiCountryDataset(countries: CountryCode[], year: number): Promise<{
  events: CalendarEvent[];
  errors: string[];
}> {
  const allEvents: CalendarEvent[] = [];
  const allErrors: string[] = [];

  // Load data for each country in parallel
  const results = await Promise.all(
    countries.map(country => loadCountryData(country, year))
  );

  results.forEach(result => {
    allEvents.push(...result.events);
    allErrors.push(...result.errors);
  });

  return { events: allEvents, errors: allErrors };
}

// Legacy function for backwards compatibility - loads SA data only
export async function loadSADataset(year: number): Promise<{
  events: CalendarEvent[];
  errors: string[];
}> {
  return loadCountryData('za', year);
}

// Check if dataset exists for a year (legacy - SA only)
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
