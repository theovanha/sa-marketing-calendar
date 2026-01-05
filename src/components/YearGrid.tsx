'use client';

import { useMemo } from 'react';
import { useAppStore, useBrandEvents } from '@/lib/store';
import {
  groupEventsByMonth,
  filterEvents,
  searchEvents,
  materializeRecurringEvents,
} from '@/lib/utils';
import { MonthCard } from './MonthCard';

export function YearGrid() {
  const {
    selectedBrandId,
    selectedYear,
    filters,
    searchQuery,
  } = useAppStore();

  // Get all events for this brand (including global SA events)
  const allEvents = useBrandEvents(selectedBrandId);

  // Process events: materialize recurring, filter, search, group by month
  const eventsByMonth = useMemo(() => {
    // 1. Materialize recurring events for the selected year
    const materializedEvents = materializeRecurringEvents(allEvents, selectedYear);

    // 2. Apply filters
    const filteredEvents = filterEvents(materializedEvents, filters);

    // 3. Apply search
    const searchedEvents = searchEvents(filteredEvents, searchQuery);

    // 4. Group by month
    return groupEventsByMonth(searchedEvents, selectedYear);
  }, [allEvents, selectedYear, filters, searchQuery]);

  // Quarter labels
  const quarters = [
    { label: 'Q1', months: [0, 1, 2] },
    { label: 'Q2', months: [3, 4, 5] },
    { label: 'Q3', months: [6, 7, 8] },
    { label: 'Q4', months: [9, 10, 11] },
  ];

  return (
    <div className="space-y-8">
      {quarters.map((quarter, qIndex) => (
        <section key={quarter.label}>
          {/* Quarter header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold" style={{ color: '#00F59B' }}>{quarter.label}</span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          {/* Month cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quarter.months.map((month, mIndex) => (
              <div
                key={month}
                className="animate-in"
                style={{ animationDelay: `${(qIndex * 3 + mIndex) * 50}ms` }}
              >
                <MonthCard
                  month={month}
                  year={selectedYear}
                  events={eventsByMonth.get(month) || []}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

