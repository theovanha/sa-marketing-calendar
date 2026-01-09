// ============================================
// Core Data Types for SA Marketing Calendar
// ============================================

export type EventType =
  | 'publicHoliday'
  | 'schoolTerm'
  | 'backToSchool'
  | 'season'
  | 'culture'
  | 'brandMoment'
  | 'campaignFlight'
  | 'keyDate' // User-added key dates (gray styling)
  | 'deadline'; // Deadline with custom color

export type Importance = 'high' | 'med' | 'low';

export type Visibility = 'internal' | 'client';

export type Channel = 'Meta' | 'Google' | 'TikTok' | 'CRM' | 'YouTube' | 'Influencers';

export type Objective = 'Awareness' | 'Leads' | 'Sales';

export interface EventLink {
  label: string;
  url: string;
}

export interface Recurrence {
  freq: 'yearly';
}

export interface CalendarEvent {
  id: string;
  brandId: string | null; // null = global SA dataset
  title: string;
  type: EventType;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, optional for single-day events
  tags: string[];
  importance: Importance;
  visibility: Visibility;
  channels?: Channel[]; // only for campaign flights
  objective?: Objective; // only for campaign flights
  notes?: string; // markdown
  links?: EventLink[];
  recurrence?: Recurrence; // for brand moments
  customColor?: string; // custom color for deadline events
}

// Available countries for key events
export type CountryCode = 'global' | 'us' | 'uk' | 'au' | 'id' | 'za';

export const COUNTRY_OPTIONS: { code: CountryCode; label: string; description: string }[] = [
  { code: 'global', label: 'GLOBAL', description: 'International events & major sporting events' },
  { code: 'us', label: 'USA', description: 'US federal holidays & cultural moments' },
  { code: 'uk', label: 'UK', description: 'UK bank holidays & cultural moments' },
  { code: 'au', label: 'AUSTRALIA', description: 'Australian public holidays & cultural moments' },
  { code: 'id', label: 'INDONESIA', description: 'Indonesian public holidays & cultural moments' },
  { code: 'za', label: 'SOUTH AFRICA', description: 'SA public holidays, school terms & cultural moments' },
];

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  timezone: string; // default: "Africa/Johannesburg"
  countries: CountryCode[]; // Countries for key events, default: ['za']
  archived?: boolean;
  createdAt: string;
}

// Filter state for the calendar view (simplified)
export interface FilterState {
  keyDates: boolean;      // Public holidays + cultural moments combined
  school: boolean;        // School terms + back-to-school
  seasons: boolean;       // Seasonal markers
  brandDates: boolean;    // User-created brand moments
  campaignFlights: boolean; // User-created campaigns
  deadlines: boolean;     // User-created deadlines
}

// Event template types for quick add
export type EventTemplate =
  | 'founderBirthday'
  | 'companyAnniversary'
  | 'brandMoment'
  | 'campaignFlight'
  | 'paydayWindow';

export interface TemplateConfig {
  id: EventTemplate;
  label: string;
  description: string;
  defaultType: EventType;
  isRange: boolean;
  defaultRecurrence: boolean;
}

// Planning prompt for anchor events
export interface PlanningPrompt {
  eventTypes: EventType[];
  keywords?: string[]; // match against event title
  leadTimeDays: number;
  suggestedChannels: Channel[];
  creativeAngle: string;
  offerPattern?: string;
}

// Sort priority for event types (lower = higher priority)
export const EVENT_TYPE_PRIORITY: Record<EventType, number> = {
  publicHoliday: 0,
  deadline: 1, // Deadlines are high priority
  backToSchool: 2,
  schoolTerm: 3,
  brandMoment: 4,
  campaignFlight: 5,
  keyDate: 6,
  culture: 7,
  season: 8,
};

// Color mapping for event types (holiday + culture both use 'keydate' style)
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  publicHoliday: 'keydate',
  schoolTerm: 'school',
  backToSchool: 'school',
  season: 'season',
  culture: 'keydate',
  brandMoment: 'brand',
  campaignFlight: 'campaign',
  keyDate: 'keydate', // User-added key dates use same gray style
  deadline: 'deadline', // Custom color from event.customColor
};

// Event template configurations
export const EVENT_TEMPLATES: TemplateConfig[] = [
  {
    id: 'founderBirthday',
    label: "Founder's Birthday",
    description: 'Annual celebration of the founder',
    defaultType: 'brandMoment',
    isRange: false,
    defaultRecurrence: true,
  },
  {
    id: 'companyAnniversary',
    label: 'Company Anniversary',
    description: 'Annual company founding celebration',
    defaultType: 'brandMoment',
    isRange: false,
    defaultRecurrence: true,
  },
  {
    id: 'brandMoment',
    label: 'Brand Moment',
    description: 'Custom brand-specific event',
    defaultType: 'brandMoment',
    isRange: false,
    defaultRecurrence: false,
  },
  {
    id: 'campaignFlight',
    label: 'Campaign Flight',
    description: 'Marketing campaign with date range',
    defaultType: 'campaignFlight',
    isRange: true,
    defaultRecurrence: false,
  },
  {
    id: 'paydayWindow',
    label: 'Payday Window',
    description: 'Peak spending period around payday',
    defaultType: 'campaignFlight',
    isRange: true,
    defaultRecurrence: false,
  },
];
