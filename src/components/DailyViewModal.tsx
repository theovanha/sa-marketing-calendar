'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { CalendarEvent, EventType, EVENT_TYPE_COLORS } from '@/lib/types';
import { MONTH_NAMES, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isWeekend,
  isSameDay,
} from 'date-fns';

interface DailyViewModalProps {
  month: number; // 0-11
  year: number;
  events: CalendarEvent[];
  onClose: () => void;
}

// Compact event display for daily view
function DayEventPill({ event }: { event: CalendarEvent }) {
  const { deleteEvent } = useAppStore();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isBrandMoment = event.type === 'brandMoment';
  const isCampaign = event.type === 'campaignFlight';
  const isPublicHoliday = event.type === 'publicHoliday';
  
  const textColor = isPublicHoliday 
    ? '#00F59B'
    : isCampaign
      ? '#FACC15'
      : isBrandMoment
        ? '#ffffff'
        : '#a1a1aa';

  const bgColor = isPublicHoliday
    ? 'rgba(0, 245, 155, 0.15)'
    : isCampaign
      ? 'rgba(250, 204, 21, 0.15)'
      : isBrandMoment
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(161, 161, 170, 0.1)';

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="px-1.5 py-0.5 rounded text-[10px] leading-tight cursor-default overflow-hidden"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <span className="line-clamp-2">{event.title}</span>
      </div>
      
      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute z-50 left-0 bottom-full mb-1 px-2 py-1 bg-surface-800 border border-surface-700 rounded shadow-lg text-xs text-white whitespace-nowrap">
          {event.title}
        </div>
      )}
    </div>
  );
}

export function DailyViewModal({ month, year, events, onClose }: DailyViewModalProps) {
  const { selectedBrandId, createEvent } = useAppStore();
  const monthDate = new Date(year, month, 1);
  const [addingToDate, setAddingToDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('brandMoment');
  const inputRef = useRef<HTMLInputElement>(null);
  const monthName = MONTH_NAMES[month];

  // Focus input when adding
  useEffect(() => {
    if (addingToDate && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingToDate]);

  const handleDoubleClick = (dateStr: string, inCurrentMonth: boolean) => {
    if (!inCurrentMonth) return;
    setAddingToDate(dateStr);
    setNewEventTitle('');
    setNewEventType('brandMoment');
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !addingToDate) return;
    
    createEvent({
      brandId: selectedBrandId,
      title: newEventTitle.trim(),
      type: newEventType,
      startDate: addingToDate,
      tags: [],
      importance: 'med',
      visibility: 'client',
    });
    
    setAddingToDate(null);
    setNewEventTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEvent();
    } else if (e.key === 'Escape') {
      setAddingToDate(null);
      setNewEventTitle('');
    }
  };

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
              const isAddingHere = addingToDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onDoubleClick={() => handleDoubleClick(dateStr, inCurrentMonth)}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg border transition-colors',
                    inCurrentMonth ? 'border-surface-800 hover:border-surface-600 cursor-pointer' : 'border-transparent',
                    weekend && inCurrentMonth && 'bg-surface-800/50',
                    !inCurrentMonth && 'opacity-30',
                    today && 'ring-1 ring-[#00F59B]',
                    isAddingHere && 'ring-2 ring-[#00F59B] border-[#00F59B]'
                  )}
                  title={inCurrentMonth ? 'Double-click to add event' : undefined}
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

                  {/* Inline add form */}
                  {isAddingHere && (
                    <div className="mb-1 space-y-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Event name..."
                        className="w-full text-[10px] bg-surface-800 border border-surface-600 rounded px-1.5 py-1 text-white placeholder:text-surface-500 focus:outline-none focus:border-[#00F59B]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-1">
                        <select
                          value={newEventType}
                          onChange={(e) => setNewEventType(e.target.value as EventType)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-[9px] bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-white focus:outline-none"
                        >
                          <option value="brandMoment">Brand</option>
                          <option value="campaignFlight">Campaign</option>
                          <option value="keyDate">Key Date</option>
                        </select>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddEvent(); }}
                          className="px-2 py-0.5 text-[9px] font-medium rounded"
                          style={{ backgroundColor: '#00F59B', color: '#000' }}
                        >
                          Add
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAddingToDate(null); }}
                          className="px-2 py-0.5 text-[9px] font-medium rounded bg-surface-700 text-surface-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, isAddingHere ? 2 : 4).map((event) => (
                      <DayEventPill key={event.id} event={event} />
                    ))}
                    {dayEvents.length > (isAddingHere ? 2 : 4) && (
                      <div className="text-[10px] text-surface-500 font-medium">
                        +{dayEvents.length - (isAddingHere ? 2 : 4)} more
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

