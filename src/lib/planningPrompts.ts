import type { Channel, EventType } from './types';

// ============================================
// Planning Prompts for Anchor Events
// Provides lead-time guidance and campaign suggestions
// ============================================

export interface PlanningPrompt {
  // Match conditions
  eventTypes: EventType[];
  titleKeywords?: string[]; // Optional keywords to match in event title

  // Planning guidance
  leadTimeDays: number; // How many days before the event to start
  briefDeadlineDays: number; // When creative brief should be done
  assetsDeadlineDays: number; // When assets should be ready

  // Suggestions
  suggestedChannels: Channel[];
  creativeAngle: string;
  offerPattern?: string;

  // Display
  promptTitle: string;
  promptDescription: string;
}

// Planning prompts configuration
export const PLANNING_PROMPTS: PlanningPrompt[] = [
  // Public Holidays
  {
    eventTypes: ['publicHoliday'],
    titleKeywords: ['Christmas', 'Day of Goodwill'],
    leadTimeDays: 42, // 6 weeks
    briefDeadlineDays: 35,
    assetsDeadlineDays: 21,
    suggestedChannels: ['Meta', 'Google', 'CRM', 'YouTube'],
    creativeAngle: 'Gifting, family togetherness, celebration, end-of-year deals',
    offerPattern: 'Bundle deals, gift guides, free shipping, extended returns',
    promptTitle: 'Festive Season Campaign',
    promptDescription: 'Peak retail period. Start prospecting early and ramp up retargeting closer to the date.',
  },
  {
    eventTypes: ['publicHoliday'],
    titleKeywords: ['Black Friday', 'Cyber Monday'],
    leadTimeDays: 28, // 4 weeks
    briefDeadlineDays: 21,
    assetsDeadlineDays: 14,
    suggestedChannels: ['Meta', 'Google', 'CRM', 'TikTok'],
    creativeAngle: 'Urgency, limited time, biggest savings of the year',
    offerPattern: 'Deep discounts, flash sales, early access for VIPs',
    promptTitle: 'Black Friday / Cyber Monday',
    promptDescription: 'Highest competition period. Build email lists in advance. Launch teasers 1 week before.',
  },
  {
    eventTypes: ['publicHoliday'],
    titleKeywords: ["Women's Day"],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google', 'Influencers'],
    creativeAngle: 'Empowerment, self-care, celebration of women',
    offerPattern: 'Gift sets, pampering packages, donation tie-ins',
    promptTitle: "Women's Day Campaign",
    promptDescription: 'Focus on beauty, wellness, and empowerment themes. Consider influencer partnerships.',
  },
  {
    eventTypes: ['publicHoliday'],
    titleKeywords: ['Heritage Day'],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google', 'YouTube'],
    creativeAngle: 'SA pride, braai culture, outdoor gatherings, diverse heritage',
    offerPattern: 'Braai bundles, outdoor gear, proudly SA products',
    promptTitle: 'Heritage Day / Braai Day',
    promptDescription: 'Celebrate SA culture. Great for food, outdoor, and lifestyle brands.',
  },
  {
    eventTypes: ['publicHoliday'],
    titleKeywords: ['Youth Day'],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'TikTok', 'Influencers'],
    creativeAngle: 'Youth empowerment, education, opportunity, fresh perspectives',
    offerPattern: 'Student discounts, youth-focused products',
    promptTitle: 'Youth Day Campaign',
    promptDescription: 'Target Gen Z. Consider TikTok-first creative and youth influencers.',
  },

  // Back to School
  {
    eventTypes: ['backToSchool'],
    leadTimeDays: 28, // 4 weeks
    briefDeadlineDays: 21,
    assetsDeadlineDays: 14,
    suggestedChannels: ['Meta', 'Google', 'CRM'],
    creativeAngle: 'New beginnings, preparation, getting ahead',
    offerPattern: 'Bundle deals on essentials, checklist-based shopping',
    promptTitle: 'Back to School',
    promptDescription: 'Target parents 3-4 weeks before. Stationery, uniforms, lunch boxes, bags.',
  },

  // Cultural Moments
  {
    eventTypes: ['culture'],
    titleKeywords: ["Valentine's Day"],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google', 'CRM'],
    creativeAngle: 'Romance, appreciation, treating someone special',
    offerPattern: 'Gift sets, experiences, delivery guarantees',
    promptTitle: "Valentine's Day",
    promptDescription: 'Target gift buyers. Jewelry, flowers, dining, experiences.',
  },
  {
    eventTypes: ['culture'],
    titleKeywords: ["Mother's Day"],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google', 'CRM'],
    creativeAngle: 'Appreciation, pampering, making mom feel special',
    offerPattern: 'Gift sets, spa packages, personalized items',
    promptTitle: "Mother's Day",
    promptDescription: 'Key gifting moment. Flowers, beauty, experiences, home goods.',
  },
  {
    eventTypes: ['culture'],
    titleKeywords: ["Father's Day"],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google', 'CRM'],
    creativeAngle: 'Appreciation, quality time, practical gifts',
    offerPattern: 'Tech bundles, experience gifts, premium items',
    promptTitle: "Father's Day",
    promptDescription: 'Target gift buyers. Tech, outdoor gear, experiences, apparel.',
  },
  {
    eventTypes: ['culture'],
    titleKeywords: ['Easter'],
    leadTimeDays: 21,
    briefDeadlineDays: 14,
    assetsDeadlineDays: 7,
    suggestedChannels: ['Meta', 'Google'],
    creativeAngle: 'Family time, long weekend, chocolate and treats',
    offerPattern: 'Chocolate bundles, travel deals, family activities',
    promptTitle: 'Easter Weekend',
    promptDescription: 'Long weekend opportunity. Travel, confectionery, family activities.',
  },

  // Seasons
  {
    eventTypes: ['season'],
    titleKeywords: ['Festive'],
    leadTimeDays: 35,
    briefDeadlineDays: 28,
    assetsDeadlineDays: 21,
    suggestedChannels: ['Meta', 'Google', 'CRM', 'YouTube'],
    creativeAngle: 'Holiday spirit, gifting, family gatherings, year-end celebration',
    offerPattern: 'Holiday bundles, gift guides, free shipping',
    promptTitle: 'Festive Season',
    promptDescription: 'Peak retail window. Plan campaigns across the entire period.',
  },

  // Generic fallback for public holidays
  {
    eventTypes: ['publicHoliday'],
    leadTimeDays: 14,
    briefDeadlineDays: 10,
    assetsDeadlineDays: 5,
    suggestedChannels: ['Meta', 'Google'],
    creativeAngle: 'Celebration, relaxation, time off',
    promptTitle: 'Public Holiday',
    promptDescription: 'Consider if this holiday is relevant for your brand and audience.',
  },
];

// Find the best matching planning prompt for an event
export function findPlanningPrompt(
  eventType: EventType,
  eventTitle: string
): PlanningPrompt | null {
  // First, try to find a prompt with matching keywords
  const keywordMatch = PLANNING_PROMPTS.find((prompt) => {
    if (!prompt.eventTypes.includes(eventType)) return false;
    if (!prompt.titleKeywords) return false;
    return prompt.titleKeywords.some((keyword) =>
      eventTitle.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  if (keywordMatch) return keywordMatch;

  // Fall back to generic prompt for the event type
  const typeMatch = PLANNING_PROMPTS.find((prompt) => {
    if (!prompt.eventTypes.includes(eventType)) return false;
    return !prompt.titleKeywords; // Generic prompt without keywords
  });

  return typeMatch || null;
}

// Calculate campaign dates based on planning prompt
export function calculateCampaignDates(
  eventDate: string,
  prompt: PlanningPrompt
): {
  campaignStart: string;
  campaignEnd: string;
  briefDeadline: string;
  assetsDeadline: string;
} {
  const event = new Date(eventDate);

  const campaignStart = new Date(event);
  campaignStart.setDate(campaignStart.getDate() - prompt.leadTimeDays);

  const campaignEnd = new Date(event);
  campaignEnd.setDate(campaignEnd.getDate() + 3); // Run a few days after

  const briefDeadline = new Date(event);
  briefDeadline.setDate(briefDeadline.getDate() - prompt.briefDeadlineDays);

  const assetsDeadline = new Date(event);
  assetsDeadline.setDate(assetsDeadline.getDate() - prompt.assetsDeadlineDays);

  return {
    campaignStart: campaignStart.toISOString().split('T')[0],
    campaignEnd: campaignEnd.toISOString().split('T')[0],
    briefDeadline: briefDeadline.toISOString().split('T')[0],
    assetsDeadline: assetsDeadline.toISOString().split('T')[0],
  };
}

