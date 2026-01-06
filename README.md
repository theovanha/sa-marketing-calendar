# SA Marketing Calendar

A 12-month South African performance marketing calendar for agencies. Plan campaigns, track brand moments, and leverage national anchor dates—all in a compact year view.

![SA Marketing Calendar](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

### 🇿🇦 South African Context
- **Public holidays** pre-loaded with marketing notes
- **School terms** and back-to-school markers
- **Cultural moments** (Valentine's Day, Mother's Day, Black Friday, etc.)
- **Seasonal data** for Southern Hemisphere

### 📅 12-Month Year View
- **Quarter-based grid** (Q1–Q4, 3 months each)
- **Compact month cards** showing event pills
- **Range bars** for campaign flights
- **Smart filtering** by event type

### 🚀 Campaign Planning
- **Planning prompts** for anchor events with:
  - Lead time recommendations
  - Suggested channels
  - Creative angles
  - Offer patterns
- **One-click campaign creation** from any anchor date
- **Channel tagging** (Meta, Google, TikTok, CRM, YouTube, Influencers)
- **Objective tracking** (Awareness, Leads, Sales)

### 🏢 Multi-Brand Support
- Create and manage multiple client brands
- Brand-specific custom events
- Separate calendars per brand
- Global SA events shared across all brands

### 💾 Local-First
- Data stored in browser localStorage
- No account required
- Works offline
- Privacy-friendly

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd Cursor_MarketingCalendar

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Loading the SA Dataset

1. Go to the **Admin** page (`/admin`)
2. Select the year (2026 data is pre-loaded)
3. Click **Load Dataset**

This will populate the calendar with:
- 12 public holidays
- 4 school terms + back-to-school dates
- 13+ cultural/commerce moments
- 5 seasonal markers

## Usage

### Creating a Brand
1. From the dashboard, click **New Brand**
2. Enter the brand name
3. A color will be auto-assigned

### Viewing the Calendar
1. Click **Open Calendar** on any brand
2. Use the **year switcher** to change years
3. Use **filter chips** to show/hide event types
4. Toggle **Holidays always on** to keep public holidays visible

### Adding Events
1. Click the **Add** button in the top bar
2. Choose a **quick template** or fill in manually:
   - Founder's Birthday
   - Company Anniversary
   - Brand Moment
   - Campaign Flight
   - Payday Window
3. Set dates, channels, and notes
4. Enable **Repeat yearly** for recurring events

### Using Planning Prompts
1. Click any **anchor event** (holiday, cultural moment, etc.)
2. View the **Planning Prompt** card with:
   - Recommended lead time
   - Brief and asset deadlines
   - Suggested channels
   - Creative angle ideas
3. Click **Create Campaign Flight** to auto-generate a campaign

## Project Structure

```
src/
├── app/
│   ├── admin/          # Dataset management
│   ├── brand/[id]/     # Brand calendar view
│   ├── dashboard/      # Agency dashboard
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # Reusable UI components
│   ├── BrandCard.tsx
│   ├── EventDrawer.tsx
│   ├── EventPill.tsx
│   ├── MonthCard.tsx
│   ├── TopBar.tsx
│   └── YearGrid.tsx
├── lib/
│   ├── dataLoader.ts   # SA dataset loader
│   ├── planningPrompts.ts
│   ├── schemas.ts      # Zod validation
│   ├── store.ts        # Zustand state
│   ├── types.ts
│   └── utils.ts
public/
└── data/
    └── za/
        ├── publicHolidays/2026.json
        ├── schoolCalendar/2026.json
        ├── culturalMoments/2026.json
        └── seasons.json
```

## Adding Data for New Years

Create JSON files in `public/data/za/` following the existing schemas:

### Public Holidays (`publicHolidays/{YEAR}.json`)
```json
{
  "year": 2027,
  "holidays": [
    {
      "title": "New Year's Day",
      "startDate": "2027-01-01",
      "importance": "high",
      "notes": "Marketing notes...",
      "tags": ["retail", "fitness"]
    }
  ]
}
```

### School Calendar (`schoolCalendar/{YEAR}.json`)
```json
{
  "year": 2027,
  "terms": [
    {
      "term": 1,
      "startDate": "2027-01-13",
      "endDate": "2027-03-26",
      "backToSchoolDate": "2027-01-13"
    }
  ]
}
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management)
- **Zod** (validation)
- **date-fns** (date utilities)
- **Lucide React** (icons)

## License

MIT

---

Built for South African marketing agencies 🇿🇦



