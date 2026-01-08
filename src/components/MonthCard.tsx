'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarEvent, EventType } from '@/lib/types';
import { MONTH_NAMES_SHORT, MONTH_NAMES, DEADLINE_COLORS, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { EventPill, RangeBar } from './EventPill';
import { DailyViewModal } from './DailyViewModal';
import { ChevronDown, ChevronUp, Plus, CalendarDays } from 'lucide-react';

// Event type options for the inline add form
const EVENT_TYPE_OPTIONS: { value: EventType; label: string; highlighted: boolean; hasColor?: boolean }[] = [
  { value: 'keyDate', label: 'Key Date', highlighted: false },
  { value: 'schoolTerm', label: 'School', highlighted: false },
  { value: 'season', label: 'Season', highlighted: false },
  { value: 'brandMoment', label: 'Brand', highlighted: true },
  { value: 'campaignFlight', label: 'Campaign', highlighted: true },
  { value: 'deadline', label: 'Deadline', highlighted: false, hasColor: true },
];

interface MonthCardProps {
  month: number; // 0-11
  year: number;
  events: CalendarEvent[];
  maxVisible?: number;
}

export function MonthCard({ month, year, events, maxVisible = 5 }: MonthCardProps) {
  const monthName = MONTH_NAMES_SHORT[month];
  const fullMonthName = MONTH_NAMES[month];
  const { selectedBrandId, setMonthNote, getMonthNote, createEvent } = useAppStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDailyView, setShowDailyView] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDay, setNewEventDay] = useState('1');
  const [newEventEndDay, setNewEventEndDay] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('brandMoment');
  const [deadlineColor, setDeadlineColor] = useState(DEADLINE_COLORS[0]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if event type supports multi-day
  const supportsMultiDay = (type: EventType) => 
    type === 'brandMoment' || type === 'campaignFlight' || type === 'deadline';
  
  // Load note on mount and when brand/year/month changes
  useEffect(() => {
    const savedNote = getMonthNote(selectedBrandId, year, month);
    setNoteValue(savedNote);
  }, [selectedBrandId, year, month, getMonthNote]);
  
  // Focus input when showing add form
  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddForm]);
  
  // Auto-save note with debounce
  const handleNoteChange = (value: string) => {
    setNoteValue(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setMonthNote(selectedBrandId, year, month, value);
    }, 500);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Add new event
  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    
    const day = parseInt(newEventDay) || 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Calculate end date if multi-day
    let endDateStr: string | undefined;
    if (newEventEndDay && supportsMultiDay(newEventType)) {
      const endDay = parseInt(newEventEndDay);
      if (endDay > day) {
        endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      }
    }
    
    createEvent({
      brandId: selectedBrandId,
      title: newEventTitle.trim(),
      type: newEventType,
      startDate: dateStr,
      endDate: endDateStr,
      tags: [],
      importance: 'med',
      visibility: 'client',
      customColor: newEventType === 'deadline' ? deadlineColor : undefined,
    });
    
    // Reset form
    setNewEventTitle('');
    setNewEventDay('1');
    setNewEventEndDay('');
    setNewEventType('brandMoment');
    setDeadlineColor(DEADLINE_COLORS[0]);
    setShowAddForm(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEvent();
    } else if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewEventTitle('');
    }
  };
  
  // Get days in month for the date picker
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Event types that support multi-day ranges
  const multiDayTypes: EventType[] = ['brandMoment', 'campaignFlight', 'deadline'];
  
  // Separate single-day events from range events
  const singleEvents = events.filter(
    (e) => !e.endDate || e.endDate === e.startDate || !multiDayTypes.includes(e.type)
  );
  const rangeEvents = events.filter(
    (e) => e.endDate && e.endDate !== e.startDate && multiDayTypes.includes(e.type)
  );

  const visibleEvents = isExpanded ? singleEvents : singleEvents.slice(0, maxVisible);
  const hiddenCount = singleEvents.length - maxVisible;

  // Check if this is the current month
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  return (
    <div 
      className="month-card"
      style={isCurrentMonth ? { boxShadow: '0 0 0 1px rgba(0, 245, 155, 0.5)' } : undefined}
    >
      <div className="month-card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{monthName}</span>
          <button
            onClick={() => setShowDailyView(true)}
            className="p-1 rounded hover:bg-surface-700 text-surface-500 hover:text-white transition-colors"
            title="View daily calendar"
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
        </div>
        {events.length > 0 && (
          <span className="text-xs text-surface-500 font-normal">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        {/* Single-day events */}
        {visibleEvents.map((event, index) => (
          <div
            key={event.id}
            className="animate-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <EventPill event={event} />
          </div>
        ))}

        {/* Show more / Show less toggle */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded transition-colors"
            style={{ 
              color: '#00F59B',
              backgroundColor: 'rgba(0, 245, 155, 0.1)'
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                +{hiddenCount} more
              </>
            )}
          </button>
        )}

        {/* Range events (campaign flights) */}
        {rangeEvents.length > 0 && (
          <div className="pt-2 mt-2 border-t border-surface-800 space-y-2">
            {rangeEvents.slice(0, 3).map((event) => (
              <RangeBar
                key={event.id}
                event={event}
                monthStart={1}
                monthEnd={31}
              />
            ))}
            {rangeEvents.length > 3 && (
              <div className="text-xs text-surface-500">
                +{rangeEvents.length - 3} more flights
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {events.length === 0 && !showAddForm && (
          <div className="flex-1 flex items-center justify-center text-surface-600 text-sm py-4">
            No events
          </div>
        )}
      </div>
      
      {/* Add Event Section */}
      <div className="mt-3 pt-3 border-t border-surface-800">
        {showAddForm ? (
          <div className="space-y-2">
            {/* Event type selector */}
            <div className="flex flex-wrap gap-1">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setNewEventType(option.value)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-medium rounded transition-all',
                    newEventType === option.value
                      ? option.highlighted
                        ? 'bg-white text-black'
                        : option.value === 'deadline'
                          ? 'text-white'
                          : 'bg-surface-600 text-white'
                      : 'bg-surface-800 text-surface-500 hover:text-surface-300'
                  )}
                  style={
                    newEventType === option.value && option.value === 'deadline'
                      ? { backgroundColor: deadlineColor }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Color picker for deadline */}
            {newEventType === 'deadline' && (
              <div className="flex flex-wrap gap-1">
                {DEADLINE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setDeadlineColor(color)}
                    className={cn(
                      'w-5 h-5 rounded transition-all',
                      deadlineColor === color && 'ring-2 ring-white ring-offset-1 ring-offset-surface-900'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            
            {/* Event name and day(s) */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Event name..."
                className="flex-1 text-xs bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-white placeholder:text-surface-500 focus:outline-none focus:border-[#00F59B]"
              />
              <select
                value={newEventDay}
                onChange={(e) => {
                  setNewEventDay(e.target.value);
                  // Reset end day if start day changes
                  if (newEventEndDay && parseInt(e.target.value) >= parseInt(newEventEndDay)) {
                    setNewEventEndDay('');
                  }
                }}
                className="w-14 text-xs bg-surface-800 border border-surface-700 rounded px-1 py-1.5 text-white focus:outline-none focus:border-[#00F59B]"
                title="Start day"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              {supportsMultiDay(newEventType) && (
                <>
                  <span className="text-surface-500 text-xs self-center">–</span>
                  <select
                    value={newEventEndDay}
                    onChange={(e) => setNewEventEndDay(e.target.value)}
                    className="w-14 text-xs bg-surface-800 border border-surface-700 rounded px-1 py-1.5 text-white focus:outline-none focus:border-[#00F59B]"
                    title="End day (optional)"
                  >
                    <option value="">—</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1)
                      .filter(day => day > parseInt(newEventDay))
                      .map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddEvent}
                disabled={!newEventTitle.trim()}
                className="flex-1 text-xs font-medium py-1.5 rounded disabled:opacity-50"
                style={{ backgroundColor: '#00F59B', color: '#000' }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewEventTitle('');
                  setNewEventType('brandMoment');
                }}
                className="flex-1 text-xs font-medium py-1.5 rounded bg-surface-800 text-surface-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-surface-500 hover:text-white rounded hover:bg-surface-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add event
          </button>
        )}
      </div>
      
      {/* Notes section */}
      <div className="mt-2">
        <textarea
          value={noteValue}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Notes..."
          className="month-notes"
        />
      </div>

      {/* Daily View Modal */}
      {showDailyView && (
        <DailyViewModal
          month={month}
          year={year}
          events={events}
          onClose={() => setShowDailyView(false)}
        />
      )}
    </div>
  );
}
