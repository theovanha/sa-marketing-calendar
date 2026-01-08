'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';
import { MONTH_NAMES, cn } from '@/lib/utils';
import { EventPill } from './EventPill';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isWeekend,
  parseISO,
  isSameDay,
} from 'date-fns';

interface DailyViewModalProps {
  month: number; // 0-11
  year: number;
  events: CalendarEvent[];
  onClose: () => void;
}

export function DailyViewModal({ month, year, events, onClose }: DailyViewModalProps) {
  const monthDate = new Date(year, month, 1);
  const monthName = MONTH_NAMES[month];

  // Calculate calendar grid days (including days from prev/next months to fill the grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    // Start from Monday
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [month, year]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    events.forEach((event) => {
      const dateKey = event.startDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [events]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Check if a day is today
  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
          <h2 className="text-xl font-bold text-white">
            {monthName} {year}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-semibold py-2 uppercase tracking-wider',
                  i >= 5 ? 'text-surface-500' : 'text-surface-400'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayEvents = eventsByDate.get(dateStr) || [];
              const inCurrentMonth = isSameMonth(date, monthDate);
              const weekend = isWeekend(date);
              const today = isToday(date);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg border transition-colors',
                    inCurrentMonth ? 'border-surface-800' : 'border-transparent',
                    weekend && inCurrentMonth && 'bg-surface-800/50',
                    !inCurrentMonth && 'opacity-30',
                    today && 'ring-1 ring-[#00F59B]'
                  )}
                >
                  {/* Day number */}
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      today ? 'text-[#00F59B]' : inCurrentMonth ? 'text-surface-300' : 'text-surface-600'
                    )}
                  >
                    {format(date, 'd')}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="text-[10px]">
                        <EventPill event={event} compact />
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-surface-500 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

