import { z } from 'zod';

// ============================================
// Zod Schemas for SA Dataset Validation
// ============================================

// Base event schema (shared fields)
const baseEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  importance: z.enum(['high', 'med', 'low']).default('med'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Public Holiday schema
export const publicHolidaySchema = baseEventSchema.extend({
  type: z.literal('publicHoliday').default('publicHoliday'),
  visibility: z.enum(['internal', 'client']).default('client'),
});

export const publicHolidaysFileSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  holidays: z.array(publicHolidaySchema),
});

// School Calendar schema
export const schoolTermSchema = z.object({
  term: z.number().int().min(1).max(4),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  backToSchoolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const schoolCalendarFileSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  terms: z.array(schoolTermSchema).length(4, 'Must have exactly 4 school terms'),
});

// Cultural Moment schema
export const culturalMomentSchema = baseEventSchema.extend({
  type: z.literal('culture').default('culture'),
  visibility: z.enum(['internal', 'client']).default('client'),
  commerceRelevance: z.enum(['high', 'medium', 'low']).optional(),
});

export const culturalMomentsFileSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  moments: z.array(culturalMomentSchema),
});

// Season schema (evergreen)
export const seasonSchema = z.object({
  name: z.enum(['Summer', 'Autumn', 'Winter', 'Spring', 'Festive']),
  startDate: z.string().regex(/^\d{2}-\d{2}$/, 'Date must be MM-DD format (evergreen)'),
  endDate: z.string().regex(/^\d{2}-\d{2}$/, 'Date must be MM-DD format (evergreen)'),
  notes: z.string().optional(),
});

export const seasonsFileSchema = z.object({
  hemisphere: z.literal('Southern'),
  seasons: z.array(seasonSchema),
});

// Required SA public holidays (for validation)
export const REQUIRED_SA_HOLIDAYS = [
  "New Year's Day",
  'Human Rights Day',
  'Good Friday',
  'Family Day',
  'Freedom Day',
  "Workers' Day",
  'Youth Day',
  "National Women's Day",
  'Heritage Day',
  'Day of Reconciliation',
  'Christmas Day',
  'Day of Goodwill',
];

// Validation helpers
export function validatePublicHolidays(data: unknown) {
  const result = publicHolidaysFileSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }

  // Check for required holidays
  const holidayTitles = result.data.holidays.map((h) => h.title);
  const missingHolidays = REQUIRED_SA_HOLIDAYS.filter(
    (required) => !holidayTitles.some((title) => title.includes(required) || required.includes(title))
  );

  if (missingHolidays.length > 0) {
    return {
      valid: false,
      errors: [{ message: `Missing required holidays: ${missingHolidays.join(', ')}` }],
    };
  }

  return { valid: true, data: result.data };
}

export function validateSchoolCalendar(data: unknown) {
  const result = schoolCalendarFileSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}

export function validateCulturalMoments(data: unknown) {
  const result = culturalMomentsFileSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}

export function validateSeasons(data: unknown) {
  const result = seasonsFileSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}

// Type exports
export type PublicHolidayData = z.infer<typeof publicHolidaySchema>;
export type PublicHolidaysFile = z.infer<typeof publicHolidaysFileSchema>;
export type SchoolTermData = z.infer<typeof schoolTermSchema>;
export type SchoolCalendarFile = z.infer<typeof schoolCalendarFileSchema>;
export type CulturalMomentData = z.infer<typeof culturalMomentSchema>;
export type CulturalMomentsFile = z.infer<typeof culturalMomentsFileSchema>;
export type SeasonData = z.infer<typeof seasonSchema>;
export type SeasonsFile = z.infer<typeof seasonsFileSchema>;


