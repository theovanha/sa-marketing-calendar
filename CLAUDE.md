# CLAUDE.md

Onboarding notes for Claude Code (and humans) working on this repo. Read this first.

## Overview

**SA / VANHA Marketing Calendar** — a 12-month performance-marketing planner built for a South
African marketing agency. An agency plans a year of campaigns per client **brand** on a compact,
quarter-based (Q1–Q4) grid. The app pre-loads regional **anchor dates** (SA public holidays,
school terms, cultural/commerce moments, seasons, plus optional multi-country packs) and lets
users layer their own brand moments, campaign flights, deadlines, and key dates on top, then
share a read-only calendar with clients.

## Run it

```bash
npm install
npm run dev          # http://localhost:3001  (NOTE: 3001, not 3000)
```

Requires a `.env.local` at the repo root (git-ignored) with Supabase credentials — see
**Environment setup** below. Without it, the Supabase client is `null` and the app loads with
no persisted data.

Other scripts: `npm run build`, `npm run start` (port 3001), `npm run lint`. Deployed on **Netlify**
(`netlify.toml`, `@netlify/plugin-nextjs`).

## Environment setup (Supabase)

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Both values come from the Supabase dashboard → **Project Settings → API** (Project URL + the
`anon` / public key). To stand up a fresh database, run `supabase-schema.sql` (repo root) in the
Supabase SQL editor. On boot, `src/lib/supabase.ts` logs `[SUPABASE_DEBUG]` with `hasUrl` /
`hasKey` / `Client created` so you can confirm the env is wired up.

## Architecture

Three data sources feed the UI:

1. **Supabase (Postgres) — source of truth** for all real data: `brands`, `events`,
   `hidden_events`, `month_notes`. Accessed directly from the store via `src/lib/supabaseService.ts`
   (no Next.js API routes in between).
2. **Static JSON — anchor dates**, in `public/data/{country}/{type}/{year}.json` (e.g.
   `za/publicHolidays/2026.json`). Loaded and converted to `CalendarEvent`s by `src/lib/dataLoader.ts`,
   validated with Zod (`src/lib/schemas.ts`). These are the read-only **global** events.
3. **localStorage — UI prefs only.** The Zustand store persists **only** `selectedBrandId`,
   `selectedYear`, `filters`, and `noteHeights` (see `partialize` in `src/lib/store.ts`).
   No brand/event/note data is stored locally — this was a deliberate change to prevent the old
   localStorage-quota / silent-data-loss problem.

**Sync pattern:** the store applies optimistic local updates, then writes to Supabase in the
background and **rolls back** on failure (surfacing an `ErrorToast`). `initializeFromSupabase()`
(called on mount by `DataAutoLoader`) loads everything from Supabase. Global events
(`brandId === null`) are materialised from the static JSON, not stored in Supabase.

## Domain model (`src/lib/types.ts`)

- **`CalendarEvent`** — `brandId === null` means a **global/anchor** event (shared across brands);
  otherwise it belongs to one brand.
  - `type: EventType` = `publicHoliday | schoolTerm | backToSchool | season | culture |
    brandMoment | campaignFlight | keyDate | deadline`.
  - Campaign flights carry `channels` (`Meta | Google | TikTok | CRM | YouTube | Influencers`) and
    `objective` (`Awareness | Leads | Sales`). Deadlines carry a `customColor`.
  - Optional `endDate` (ranges), `recurrence: { freq: 'yearly' }`, `notes` (markdown), `links`.
- **`Brand`** — `id`, `name`, `primaryColor`, `timezone` (default `Africa/Johannesburg`),
  `countries: CountryCode[]` (which anchor-date packs to show), `archived`.
- **Multi-country packs** (`CountryCode`): `global | us | uk | au | id | za`.
- **`FilterState`** — six toggles: `keyDates`, `school`, `seasons`, `brandDates`, `campaignFlights`,
  `deadlines`.

## Routes & key files

Routes (App Router, `src/app/`):
- `/dashboard` — brands hub (list, create, archive, delete, copy client link).
- `/brand/[id]` — the main calendar editor.
- `/client/[id]` — read-only shareable client view (`ClientTopBar` instead of `TopBar`).
- `/admin` — load anchor-date datasets by year.

Key source:
- `src/lib/store.ts` — Zustand store, all actions, sync logic, selectors (`useSelectedBrand`,
  `useActiveBrands`, `useBrandEvents`, `useGlobalEvents`, …).
- `src/lib/supabaseService.ts` — CRUD against Supabase.
- `src/lib/supabase.ts` — client init + `Db*` row types.
- `src/lib/dataLoader.ts` / `src/lib/schemas.ts` — static anchor-date loading + Zod validation.
- `src/lib/planningPrompts.ts` — lead-time / channel / creative suggestions per anchor.
- Components: `YearGrid` (quarter layout) → `MonthCard` (per-month, inline add, month notes) →
  `EventPill`; editors `EventDrawer` (full) and `EditEventModal` (quick, double-click a pill);
  `DailyViewModal` (6-week grid, drag-to-extend); `TopBar` / `ClientTopBar`; `UndoToast` / `ErrorToast`.

## Conventions

- **Styling:** Tailwind, dark theme, VANHA accent `#00F59B`. Use the `cn()` helper (`src/lib/utils.ts`,
  a clsx wrapper) for conditional classes. Event-type colours live in `EVENT_TYPE_COLORS`
  (`types.ts`) + `.event-pill-*` classes in `globals.css`; deadlines use a per-event `customColor`.
- **IDs:** `nanoid` for user data; global events use deterministic ids like
  `{country}-{type}-{year}-{index}`.
- **Dates:** `date-fns`, ISO `YYYY-MM-DD` strings throughout.

## Known issues / tech debt (recorded, not yet fixed)

- **Stale README history:** the README was written for the old localStorage-only design; it now
  reflects Supabase but double-check any claims against this file.
- **Debug scaffolding in prod:** `[SUPABASE_DEBUG]` `console.log`s in `src/lib/supabase.ts`, plus
  `DebugPanel` and `InteractionDebugger` components mounted in the layout.
- **No auth / "allow-all" RLS:** every table has `USING (true) WITH CHECK (true)`, so the public
  anon key grants full read/write. Client share links are protected only by an unguessable id.
  Fine for a small internal tool; know this before exposing it more widely.

## Gotchas

- Dev server is **port 3001** (README elsewhere may say 3000).
- **Global events (`brandId === null`) are read-only** except their title, and can only be *hidden*
  per-brand (`hidden_events`), never deleted.
- Deleting/hiding has a 5-second **undo** (stack of the last 10).
