'use client';

import { useMemo, useState, useRef, useEffect, DragEvent } from 'react';
import { X, GripVertical, Flag, GraduationCap, Sun, Target, Rocket, Clock } from 'lucide-react';
import { CalendarEvent, EventType } from '@/lib/types';
import { MONTH_NAMES, DEADLINE_COLORS, cn, filterEvents } from '@/lib/utils';
import { FilterChip } from './ui';
import { useAppStore } from '@/lib/store';
import { debugLog } from './InteractionDebugger';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
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

// Event type options for pill selector
const EVENT_TYPE_OPTIONS: { value: EventType; label: string; highlighted: boolean; hasColor?: boolean }[] = [
  { value: 'keyDate', label: 'Key Date', highlighted: false },
  { value: 'schoolTerm', label: 'School', highlighted: false },
  { value: 'season', label: 'Season', highlighted: false },
  { value: 'brandMoment', label: 'Brand', highlighted: true },
  { value: 'campaignFlight', label: 'Campaign', highlighted: true },
  { value: 'deadline', label: 'Deadline', highlighted: false, hasColor: true },
];

// Check if event type supports extending (multi-day)
const canExtendEvent = (type: EventType) => 
  type === 'brandMoment' || type === 'campaignFlight' || type === 'deadline';

// Compact event display for daily view with drag support
interface DayEventPillProps {
  event: CalendarEvent;
  onDragStart: (e: DragEvent<HTMLDivElement>, event: CalendarEvent) => void;
  onExtendStart: (e: DragEvent<HTMLDivElement>, event: CalendarEvent) => void;
}

function DayEventPill({ event, onDragStart, onExtendStart }: DayEventPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isBrandMoment = event.type === 'brandMoment';
  const isCampaign = event.type === 'campaignFlight';
  const isPublicHoliday = event.type === 'publicHoliday';
  const isDeadline = event.type === 'deadline';
  const canExtend = canExtendEvent(event.type) && event.brandId !== null; // Only brand-specific events can be extended
  
  // Use custom color for deadlines, otherwise use standard colors
  // Muted, consistent styling across single and multi-day events
  const textColor = isDeadline && event.customColor
    ? event.customColor
    : isPublicHoliday 
      ? '#00F59B'
      : (isCampaign || isBrandMoment)
        ? '#ffffff'
        : '#a1a1aa';

  const bgColor = isDeadline && event.customColor
    ? `${event.customColor}30` // ~20% opacity
    : isPublicHoliday
      ? 'rgba(0, 245, 155, 0.15)'
      : (isCampaign || isBrandMoment)
        ? 'rgba(255, 255, 255, 0.15)' // Subtle white background
        : 'rgba(161, 161, 170, 0.1)';

  const borderColor = isDeadline && event.customColor 
    ? event.customColor 
    : isPublicHoliday
      ? '#00F59B'
      : (isCampaign || isBrandMoment)
        ? '#ffffff' // White border for brand/campaign
        : undefined;
  
  // Extra styling for brand/campaign
  const isHighlighted = isCampaign || isBrandMoment;
  
  // Show date range if multi-day
  const isMultiDay = event.endDate && event.endDate !== event.startDate;
  const dateDisplay = isMultiDay 
    ? `${format(new Date(event.startDate), 'd')} - ${format(new Date(event.endDate!), 'd MMM')}`
    : null;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      draggable
      onDragStart={(e) => onDragStart(e, event)}
    >
      <div
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] leading-tight cursor-grab active:cursor-grabbing overflow-hidden flex items-center gap-1",
          isHighlighted && "font-semibold shadow-sm"
        )}
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          borderLeft: borderColor ? `2px solid ${borderColor}` : undefined,
          boxShadow: isHighlighted ? '0 1px 3px rgba(255,255,255,0.2)' : undefined
        }}
      >
        <GripVertical className="w-2 h-2 opacity-40 shrink-0" />
        <span className="line-clamp-1 flex-1">{event.title}</span>
        {isMultiDay && (
          <span className="text-[8px] opacity-60 shrink-0">{dateDisplay}</span>
        )}
      </div>
      
      {/* Extend handle on the right - only for extendable events */}
      {canExtend && (
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onExtendStart(e, event);
          }}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize",
            "bg-white/0 hover:bg-white/30 rounded-r transition-colors",
            "opacity-0 group-hover:opacity-100"
          )}
          title="Drag to extend"
        />
      )}
      
      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute z-50 left-0 bottom-full mb-1 px-2 py-1 bg-surface-800 border border-surface-700 rounded shadow-lg text-xs text-white whitespace-nowrap">
          {event.title}
          {isMultiDay && <span className="text-surface-400 ml-1">({dateDisplay})</span>}
        </div>
      )}
    </div>
  );
}

// Add Event Popup Modal
interface AddEventPopupProps {
  dateStr: string;
  onClose: () => void;
  onAdd: (title: string, type: EventType, customColor?: string, endDate?: string) => void;
}

// Check if event type supports multi-day
const supportsMultiDay = (type: EventType) => 
  type === 'brandMoment' || type === 'campaignFlight' || type === 'deadline';

function AddEventPopup({ dateStr, onClose, onAdd }: AddEventPopupProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('brandMoment');
  const [deadlineColor, setDeadlineColor] = useState(DEADLINE_COLORS[0]);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(dateStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset multi-day when switching to non-supporting type
  useEffect(() => {
    if (!supportsMultiDay(eventType)) {
      setIsMultiDay(false);
      setEndDate(dateStr);
    }
  }, [eventType, dateStr]);

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(
        title.trim(), 
        eventType, 
        eventType === 'deadline' ? deadlineColor : undefined,
        isMultiDay && endDate !== dateStr ? endDate : undefined
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Format date for display
  const displayDate = format(new Date(dateStr), 'EEEE, d MMMM yyyy');

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Add Event</h3>
            <p className="text-sm text-surface-400">{displayDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Type Pills */}
        <div className="mb-4">
          <label className="block text-xs text-surface-500 uppercase tracking-wider mb-2">
            Event Type
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setEventType(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                  eventType === option.value
                    ? option.highlighted
                      ? 'bg-white text-black'
                      : option.value === 'deadline'
                        ? 'text-white'
                        : 'bg-surface-600 text-white'
                    : 'bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700'
                )}
                style={
                  eventType === option.value && option.value === 'deadline'
                    ? { backgroundColor: deadlineColor }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker for Deadline */}
        {eventType === 'deadline' && (
          <div className="mb-4">
            <label className="block text-xs text-surface-500 uppercase tracking-wider mb-2">
              Deadline Color
            </label>
            <div className="flex flex-wrap gap-2">
              {DEADLINE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setDeadlineColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    deadlineColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-surface-900'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Multi-day option for Brand, Campaign, Deadline */}
        {supportsMultiDay(eventType) && (
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => {
                  setIsMultiDay(e.target.checked);
                  if (!e.target.checked) setEndDate(dateStr);
                }}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-[#00F59B] focus:ring-[#00F59B] focus:ring-offset-surface-900"
              />
              <span className="text-sm text-surface-300">Multi-day event</span>
            </label>
            
            {isMultiDay && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-surface-500 mb-1">Start</label>
                  <input
                    type="date"
                    value={dateStr}
                    disabled
                    className="w-full text-sm bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-400"
                  />
                </div>
                <div className="text-surface-500 pt-5">→</div>
                <div className="flex-1">
                  <label className="block text-xs text-surface-500 mb-1">End</label>
                  <input
                    type="date"
                    value={endDate}
                    min={dateStr}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00F59B]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Name Input */}
        <div className="mb-6">
          <label className="block text-xs text-surface-500 uppercase tracking-wider mb-2">
            Event Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter event name..."
            className="w-full text-sm bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-white placeholder:text-surface-500 focus:outline-none focus:border-[#00F59B]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#00F59B', color: '#000' }}
          >
            Add Event
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-surface-800 text-surface-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Filter items for the toggle chips (same as TopBar)
const filterItems = [
  { key: 'keyDates' as const, label: 'Key Dates', icon: Flag, color: '#00F59B' },
  { key: 'school' as const, label: 'School', icon: GraduationCap, color: '#8B5CF6' },
  { key: 'seasons' as const, label: 'Seasons', icon: Sun, color: '#22D3EE' },
  { key: 'brandDates' as const, label: 'Brand', icon: Target, color: '#FFFFFF' },
  { key: 'campaignFlights' as const, label: 'Campaigns', icon: Rocket, color: '#FFFFFF' },
  { key: 'deadlines' as const, label: 'Deadlines', icon: Clock, color: '#ef4444' },
];

export function DailyViewModal({ month, year, events, onClose }: DailyViewModalProps) {
  const { selectedBrandId, createEvent, updateEvent, filters, toggleFilter } = useAppStore();
  const monthDate = new Date(year, month, 1);
  const [addingToDate, setAddingToDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [extendingEvent, setExtendingEvent] = useState<CalendarEvent | null>(null);
  const [dragX, setDragX] = useState<number | null>(null); // Track mouse X for smooth preview
  const [weekContainerRect, setWeekContainerRect] = useState<DOMRect | null>(null);
  const [currentDragWeekIndex, setCurrentDragWeekIndex] = useState<number | null>(null); // Track which week row cursor is in
  const modalRef = useRef<HTMLDivElement>(null);
  const monthName = MONTH_NAMES[month];
  
  // Helper to enable/disable event bar pointer events synchronously
  const setEventBarsPointerEvents = (enabled: boolean) => {
    if (modalRef.current) {
      const bars = modalRef.current.querySelectorAll('.event-bar');
      bars.forEach((bar) => {
        (bar as HTMLElement).style.pointerEvents = enabled ? 'auto' : 'none';
      });
    }
  };
  
  // Calculate preview event for live feedback while dragging
  const previewEvent = useMemo((): CalendarEvent | null => {
    if (extendingEvent && dragOverDate) {
      // Preview extending/shortening: update the end date
      // Allow any date >= start date (including shortening to single day)
      if (dragOverDate >= extendingEvent.startDate) {
        const newEndDate = dragOverDate === extendingEvent.startDate ? undefined : dragOverDate;
        // Only show preview if it's different from current state
        if (newEndDate !== extendingEvent.endDate) {
          return {
            ...extendingEvent,
            endDate: newEndDate,
          };
        }
      }
    } else if (draggedEvent && dragOverDate && draggedEvent.endDate) {
      // Preview moving multi-day event: shift both start and end dates
      if (draggedEvent.startDate !== dragOverDate) {
        const startDate = new Date(draggedEvent.startDate);
        const endDate = new Date(draggedEvent.endDate);
        const duration = endDate.getTime() - startDate.getTime();
        const newEndDate = new Date(new Date(dragOverDate).getTime() + duration);
        return {
          ...draggedEvent,
          startDate: dragOverDate,
          endDate: format(newEndDate, 'yyyy-MM-dd'),
        };
      }
    }
    return null;
  }, [extendingEvent, draggedEvent, dragOverDate]);

  const handleDoubleClick = (dateStr: string, inCurrentMonth: boolean) => {
    if (!inCurrentMonth) return;
    setAddingToDate(dateStr);
  };

  const handleAddEvent = (title: string, type: EventType, customColor?: string, endDate?: string) => {
    if (!addingToDate) return;
    
    createEvent({
      brandId: selectedBrandId,
      title,
      type,
      startDate: addingToDate,
      endDate,
      tags: [],
      importance: 'med',
      visibility: 'client',
      customColor,
    });
    
    setAddingToDate(null);
  };

  // Drag and drop handlers for moving events
  const handleDragStart = (e: DragEvent<HTMLDivElement>, event: CalendarEvent) => {
    debugLog('drag-start', `Moving event: ${event.title}`, {
      eventId: event.id,
      startDate: event.startDate,
      endDate: event.endDate,
    });
    // SYNC: Disable pointer events on all event bars so drops reach day cells
    setEventBarsPointerEvents(false);
    setDraggedEvent(event);
    setExtendingEvent(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.setData('action', 'move');
  };

  // Drag handler for extending events
  const handleExtendStart = (e: DragEvent<HTMLDivElement>, event: CalendarEvent) => {
    debugLog('drag-start', `Extending event: ${event.title}`, {
      eventId: event.id,
      startDate: event.startDate,
      endDate: event.endDate,
    });
    // SYNC: Disable pointer events on all event bars so drops reach day cells
    setEventBarsPointerEvents(false);
    setExtendingEvent(event);
    setDraggedEvent(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.setData('action', 'extend');
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dateStr: string, inCurrentMonth: boolean, weekEl?: HTMLElement | null, weekIdx?: number) => {
    // Block if no drag operation, or if moving (not extending) to outside current month
    // Allow extending to any visible date (including next month)
    if ((!draggedEvent && !extendingEvent) || (draggedEvent && !inCurrentMonth)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only log occasionally to avoid spam (every 10th call)
    if (Math.random() < 0.1) {
      debugLog('drag-over', `Over date: ${dateStr}`, {
        weekIndex: weekIdx,
        isDragging: !!draggedEvent,
        isExtending: !!extendingEvent,
        extendingEventStart: extendingEvent?.startDate,
      });
    }
    
    setDragOverDate(dateStr);
    
    // Track mouse X position for smooth preview
    setDragX(e.clientX);
    
    // Store week container rect and index for smooth preview calculation
    if (weekEl) {
      setWeekContainerRect(weekEl.getBoundingClientRect());
    }
    if (weekIdx !== undefined) {
      setCurrentDragWeekIndex(weekIdx);
    }
  };

  const handleDragLeave = () => {
    debugLog('drag-leave', 'Left drag area');
    // Don't clear immediately - let it stay for smoother experience
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dateStr: string, inCurrentMonth: boolean) => {
    debugLog('drop', `Dropped on: ${dateStr}`, {
      inCurrentMonth,
      isDragging: !!draggedEvent,
      isExtending: !!extendingEvent,
      extendingEventId: extendingEvent?.id,
      extendingEventStart: extendingEvent?.startDate,
      extendingEventEnd: extendingEvent?.endDate,
    });
    
    // SYNC: Re-enable pointer events on all event bars
    setEventBarsPointerEvents(true);
    
    e.preventDefault();
    setDragOverDate(null);
    setDragX(null);
    setWeekContainerRect(null);
    setCurrentDragWeekIndex(null);
    
    // Only block drops outside current month for move operations (not extend)
    // Allow extending events to any visible date (including next month)
    if (!inCurrentMonth && !extendingEvent) {
      debugLog('state-change', 'Drop ignored - not in current month (move operation)');
      setDraggedEvent(null);
      return;
    }
    
    // Handle extending event
    if (extendingEvent) {
      // Only allow extending brand-specific events
      if (extendingEvent.brandId === null) {
        debugLog('state-change', 'Extend ignored - global event');
        setExtendingEvent(null);
        return;
      }
      
      // Extend if drop date is after start date
      if (dateStr > extendingEvent.startDate) {
        debugLog('state-change', `Extending to: ${dateStr}`, { newEndDate: dateStr });
        updateEvent(extendingEvent.id, { endDate: dateStr });
      } else {
        // If dropped on start date OR before it, make it single-day
        debugLog('state-change', `Making single-day (dropped on ${dateStr}, start is ${extendingEvent.startDate})`);
        updateEvent(extendingEvent.id, { endDate: undefined });
      }
      
      setExtendingEvent(null);
      return;
    }
    
    // Handle moving event
    if (draggedEvent) {
      // Only allow moving brand-specific events (not global SA events)
      if (draggedEvent.brandId === null) {
        setDraggedEvent(null);
        return;
      }
      
      // Update the event's date
      if (draggedEvent.startDate !== dateStr) {
        // If it's a multi-day event, maintain the duration
        if (draggedEvent.endDate) {
          const startDate = new Date(draggedEvent.startDate);
          const endDate = new Date(draggedEvent.endDate);
          const duration = endDate.getTime() - startDate.getTime();
          const newEndDate = new Date(new Date(dateStr).getTime() + duration);
          updateEvent(draggedEvent.id, { 
            startDate: dateStr,
            endDate: format(newEndDate, 'yyyy-MM-dd')
          });
        } else {
          updateEvent(draggedEvent.id, { startDate: dateStr });
        }
      }
      
      setDraggedEvent(null);
    }
  };

  const handleDragEnd = () => {
    debugLog('drag-end', 'Drag ended', {
      hadDraggedEvent: !!draggedEvent,
      hadExtendingEvent: !!extendingEvent,
      lastDragOverDate: dragOverDate,
    });
    // SYNC: Re-enable pointer events on all event bars
    setEventBarsPointerEvents(true);
    setDraggedEvent(null);
    setExtendingEvent(null);
    setDragOverDate(null);
    setDragX(null);
    setWeekContainerRect(null);
    setCurrentDragWeekIndex(null);
  };

  // Calculate calendar grid days (including days from prev/next months to fill the grid)
  // Always show 6 weeks (42 days) to allow dragging events to next month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    // Start from Monday
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Calculate days in current range
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Extend to 6 weeks (42 days) if needed for drag-to-next-month functionality
    if (days.length < 42) {
      const lastDay = days[days.length - 1];
      const daysToAdd = 42 - days.length;
      for (let i = 1; i <= daysToAdd; i++) {
        days.push(addDays(lastDay, i));
      }
    }
    
    return days;
  }, [month, year]);

  // Group days into weeks for row-based rendering
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    return filterEvents(events, filters);
  }, [events, filters]);

  // Separate multi-day and single-day events
  const { multiDayEvents, singleDayEvents } = useMemo(() => {
    const multiDay: CalendarEvent[] = [];
    const singleDay: CalendarEvent[] = [];
    
    filteredEvents.forEach((event) => {
      if (event.endDate && event.endDate !== event.startDate) {
        multiDay.push(event);
      } else {
        singleDay.push(event);
      }
    });
    
    return { multiDayEvents: multiDay, singleDayEvents: singleDay };
  }, [filteredEvents]);

  // Group single-day events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    singleDayEvents.forEach((event) => {
      const dateKey = event.startDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [singleDayEvents]);

  // Helper to calculate event position in a week
  const calcEventPosition = (event: CalendarEvent, weekDays: Date[]) => {
    const weekStart = format(weekDays[0], 'yyyy-MM-dd');
    const weekEnd = format(weekDays[6], 'yyyy-MM-dd');
    const eventStart = event.startDate;
    const eventEnd = event.endDate || event.startDate;
    
    // Check if event overlaps with this week
    if (eventStart > weekEnd || eventEnd < weekStart) {
      return null;
    }
    
    let startCol = 0;
    let endCol = 6;
    
    // Find start column
    for (let i = 0; i < 7; i++) {
      const dayStr = format(weekDays[i], 'yyyy-MM-dd');
      if (dayStr >= eventStart) {
        startCol = i;
        break;
      }
    }
    
    // Find end column
    for (let i = 6; i >= 0; i--) {
      const dayStr = format(weekDays[i], 'yyyy-MM-dd');
      if (dayStr <= eventEnd) {
        endCol = i;
        break;
      }
    }
    
    const isStart = eventStart >= weekStart;
    const isEnd = eventEnd <= weekEnd;
    
    return { event, startCol, endCol, isStart, isEnd };
  };

  // Calculate which multi-day events appear in each week and their positions
  const getMultiDayEventsForWeek = (weekDays: Date[], includePreview: boolean = false) => {
    const results: { event: CalendarEvent; startCol: number; endCol: number; isStart: boolean; isEnd: boolean; isPreview?: boolean }[] = [];
    
    // Add actual multi-day events (excluding the one being dragged/extended if we have a preview)
    multiDayEvents.forEach((event) => {
      // Skip the original event if we're showing a preview of it
      if (previewEvent && event.id === previewEvent.id) {
        return;
      }
      
      const pos = calcEventPosition(event, weekDays);
      if (pos) {
        results.push(pos);
      }
    });
    
    // Add preview event if applicable (even if it becomes single-day, show the preview in overlay)
    if (includePreview && previewEvent) {
      // For preview, treat it as if it has an endDate (use startDate if no endDate)
      const previewWithEnd = {
        ...previewEvent,
        endDate: previewEvent.endDate || previewEvent.startDate,
      };
      const previewPos = calcEventPosition(previewWithEnd, weekDays);
      if (previewPos) {
        results.push({ ...previewPos, isPreview: true });
      }
    }
    
    return results;
  };

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
        ref={modalRef}
        className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800">
          <div className="flex items-center justify-between mb-3">
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
          {/* Filter toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterItems.map(({ key, label, color }) => (
              <FilterChip
                key={key}
                label={label}
                active={filters[key]}
                onClick={() => toggleFilter(key)}
                color={color}
              />
            ))}
          </div>
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

          {/* Calendar weeks */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => {
              const weekMultiDayEvents = getMultiDayEventsForWeek(week, true); // Include preview
              const multiDayHeight = weekMultiDayEvents.length * 20;
              
              return (
                <div key={weekIndex} className="relative" data-week-index={weekIndex}>
                  {/* Day cells with space for multi-day events */}
                  <div className="grid grid-cols-7 gap-1 week-grid">
                    {week.map((date, dayIndex) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayEvents = eventsByDate.get(dateStr) || [];
                      const inCurrentMonth = isSameMonth(date, monthDate);
                      const weekend = isWeekend(date);
                      const today = isToday(date);
                      const isDragOver = dragOverDate === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onDoubleClick={() => handleDoubleClick(dateStr, inCurrentMonth)}
                          onDragOver={(e) => {
                            const weekGrid = e.currentTarget.closest('.week-grid') as HTMLElement;
                            handleDragOver(e, dateStr, inCurrentMonth, weekGrid, weekIndex);
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, dateStr, inCurrentMonth)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'min-h-[100px] p-2 rounded-lg border transition-colors relative',
                            inCurrentMonth ? 'border-surface-800 hover:border-surface-600 cursor-pointer' : 'border-transparent',
                            weekend && inCurrentMonth && 'bg-surface-800/50',
                            // Dim next-month dates, but make them visible when extending
                            !inCurrentMonth && !extendingEvent && 'opacity-30',
                            !inCurrentMonth && extendingEvent && 'opacity-60 cursor-pointer',
                            today && 'ring-1 ring-[#00F59B]',
                            isDragOver && draggedEvent && 'ring-2 ring-[#00F59B] bg-[#00F59B]/10',
                            isDragOver && extendingEvent && 'ring-2 ring-blue-400 bg-blue-400/10'
                          )}
                          title={inCurrentMonth ? 'Double-click to add event' : undefined}
                        >
                          {/* Day number */}
                          <div
                            className={cn(
                              'text-sm font-medium',
                              today ? 'text-[#00F59B]' : inCurrentMonth ? 'text-surface-300' : 'text-surface-600'
                            )}
                          >
                            {format(date, 'd')}
                          </div>

                          {/* Spacer for multi-day events */}
                          {multiDayHeight > 0 && (
                            <div style={{ height: `${multiDayHeight + 4}px` }} />
                          )}

                          {/* Single-day events for this day */}
                          <div className="space-y-1 mt-1">
                            {dayEvents.slice(0, 3).map((event) => (
                              <DayEventPill 
                                key={event.id} 
                                event={event} 
                                onDragStart={handleDragStart}
                                onExtendStart={handleExtendStart}
                              />
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
                  
                  {/* Multi-day events overlaid on top, positioned inside the cells */}
                  {(weekMultiDayEvents.length > 0 || (extendingEvent && weekContainerRect && dragX !== null)) && (
                    <div 
                      className="absolute z-10"
                      style={{ 
                        top: '28px', // Below the day number
                        left: '2px',
                        right: '2px',
                        // Disable pointer events on overlay so day cells can receive drops
                        pointerEvents: 'none',
                      }}
                    >
                      {weekMultiDayEvents.filter(item => !(item as any).isPreview).map((item, idx) => {
                        const { event, startCol, endCol, isStart, isEnd } = item as any;
                        const canEdit = event.brandId !== null; // Only brand events can be edited
                        const isBeingExtended = extendingEvent?.id === event.id;
                        
                        // Determine colors based on event type
                        const isBrandMoment = event.type === 'brandMoment';
                        const isCampaign = event.type === 'campaignFlight';
                        const isDeadline = event.type === 'deadline';
                        const isPublicHoliday = event.type === 'publicHoliday';
                        const isHighlighted = isBrandMoment || isCampaign;
                        
                        // Muted solid background colors (solid so grid lines don't show, but subtle)
                        const bgColor = isDeadline && event.customColor
                          ? `${event.customColor}40` // 25% opacity converted to solid on dark bg
                          : isPublicHoliday
                            ? '#1a3d2e' // Muted green on dark
                            : isHighlighted
                              ? '#3a3a3a' // Subtle gray for brand/campaign
                              : '#2a2a2a'; // Even more subtle for others
                        
                        const textColor = isDeadline && event.customColor
                          ? event.customColor
                          : isPublicHoliday
                            ? '#00F59B'
                            : isHighlighted
                              ? '#ffffff'
                              : '#a1a1aa';
                        
                        const borderColor = isDeadline && event.customColor
                          ? event.customColor
                          : isPublicHoliday
                            ? '#00F59B'
                            : isHighlighted
                              ? '#ffffff'
                              : '#6b7280';
                        
                        // Calculate position based on grid columns
                        const colWidth = 100 / 7;
                        const leftPos = startCol * colWidth + 0.3;
                        const widthPos = (endCol - startCol + 1) * colWidth - 0.6;
                        
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "event-bar absolute flex items-center px-2 text-[10px] font-medium group",
                              "hover:brightness-125",
                              "transition-all duration-75",
                              canEdit && "cursor-grab active:cursor-grabbing",
                              isStart ? "rounded-l" : "rounded-l-none",
                              isEnd ? "rounded-r" : "rounded-r-none",
                              isBeingExtended && "opacity-50"
                            )}
                            style={{
                              left: `${leftPos}%`,
                              width: `${widthPos}%`,
                              top: `${idx * 20}px`,
                              height: '18px',
                              backgroundColor: bgColor,
                              color: textColor,
                              borderLeft: isStart ? `3px solid ${borderColor}` : undefined,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              // Enable pointer events on bars so they can be dragged (disabled during drag via JS)
                              pointerEvents: 'auto',
                            }}
                            draggable={canEdit}
                            onDragStart={(e) => canEdit && handleDragStart(e as any, event)}
                            onDragEnd={handleDragEnd}
                            title={`${event.title} (${format(new Date(event.startDate), 'd MMM')} - ${format(new Date(event.endDate!), 'd MMM')})${canEdit ? ' - Drag to move' : ''}`}
                          >
                            {isStart ? (
                              <span className="truncate flex-1">
                                {event.title}
                              </span>
                            ) : (
                              <span className="truncate opacity-50">…</span>
                            )}
                            
                            {/* Extend handle on the right edge - always visible */}
                            {isEnd && canEdit && (
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleExtendStart(e as any, event);
                                }}
                                onDragEnd={handleDragEnd}
                                className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize rounded-r flex items-center justify-center hover:bg-white/40 transition-colors"
                                style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.15)',
                                  pointerEvents: 'auto',
                                }}
                                title="Drag to extend/shorten"
                              >
                                <div className="flex flex-col gap-[2px]">
                                  <div className="w-[2px] h-[2px] bg-white/60 rounded-full" />
                                  <div className="w-[2px] h-[2px] bg-white/60 rounded-full" />
                                  <div className="w-[2px] h-[2px] bg-white/60 rounded-full" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Smooth preview that follows the cursor - for current week row */}
                      {extendingEvent && dragOverDate && (() => {
                        const weekStartStr = format(week[0], 'yyyy-MM-dd');
                        const weekEndStr = format(week[6], 'yyyy-MM-dd');
                        const eventStart = extendingEvent.startDate;
                        
                        // Determine if this week should show a preview bar
                        // Show if: event starts before/in this week AND dragOverDate is in/after this week
                        const eventStartsBeforeOrInWeek = eventStart <= weekEndStr;
                        const dragIsInOrAfterWeek = dragOverDate >= weekStartStr;
                        
                        if (!eventStartsBeforeOrInWeek || !dragIsInOrAfterWeek) return null;
                        
                        // Determine start column for this week
                        let startCol = 0;
                        if (eventStart >= weekStartStr) {
                          // Event starts in this week
                          for (let i = 0; i < 7; i++) {
                            const dayStr = format(week[i], 'yyyy-MM-dd');
                            if (dayStr >= eventStart) {
                              startCol = i;
                              break;
                            }
                          }
                        }
                        // If event started before this week, startCol stays 0
                        
                        // Colors - muted to match the actual event styling
                        const isBrandMoment = extendingEvent.type === 'brandMoment';
                        const isCampaign = extendingEvent.type === 'campaignFlight';
                        const isDeadline = extendingEvent.type === 'deadline';
                        const isPublicHoliday = extendingEvent.type === 'publicHoliday';
                        const isHighlighted = isBrandMoment || isCampaign;
                        
                        // Muted background colors to match actual events
                        const bgColor = isDeadline && extendingEvent.customColor
                          ? `${extendingEvent.customColor}40` // 25% opacity
                          : isPublicHoliday
                            ? '#1a3d2e'
                            : isHighlighted
                              ? '#3a3a3a'
                              : '#2a2a2a';
                        
                        const textColor = isDeadline && extendingEvent.customColor
                          ? extendingEvent.customColor
                          : isPublicHoliday
                            ? '#00F59B'
                            : isHighlighted
                              ? '#ffffff'
                              : '#a1a1aa';
                        
                        const borderColor = isDeadline && extendingEvent.customColor
                          ? extendingEvent.customColor
                          : isPublicHoliday
                            ? '#00F59B'
                            : isHighlighted
                              ? '#ffffff'
                              : '#6b7280';
                        
                        const isEventStartWeek = eventStart >= weekStartStr && eventStart <= weekEndStr;
                        const rowIdx = weekMultiDayEvents.findIndex(item => (item as any).event.id === extendingEvent.id);
                        const topPos = rowIdx >= 0 ? rowIdx * 20 : 0;
                        
                        // Check if this is the week where the cursor currently is
                        const isCurrentHoverWeek = currentDragWeekIndex === weekIndex;
                        
                        if (isCurrentHoverWeek && weekContainerRect && dragX !== null) {
                          // This is the week where cursor is - use smooth position
                          const containerWidth = weekContainerRect.width;
                          const containerLeft = weekContainerRect.left;
                          const colWidth = containerWidth / 7;
                          
                          // Calculate smooth position based on cursor - align to cursor tip
                          const mouseRelativeX = dragX - containerLeft;
                          
                          // Calculate which column the cursor is over (as a float for smooth)
                          // Subtract half column to center on cursor
                          const floatCol = (mouseRelativeX / colWidth) - 0.5;
                          
                          // Allow shortening all the way back to start column (for single-day)
                          // minCol is startCol - 0.5 to allow visual shrinking before snapping to single-day
                          const minCol = eventStart >= weekStartStr ? startCol - 0.5 : -0.5;
                          const clampedCol = Math.max(minCol, Math.min(6.5, floatCol));
                          
                          // Calculate positions as percentages
                          const leftPos = (startCol / 7) * 100 + 0.3;
                          // Allow width to go down to single column (no minimum)
                          const widthPos = Math.max(0.5, ((clampedCol - startCol + 1) / 7) * 100 - 0.6);
                          
                          // Check if we're showing a single-day preview
                          const isSingleDayPreview = clampedCol < startCol + 0.5;
                          
                          return (
                            <div
                              className="absolute flex items-center px-2 text-[10px] font-medium pointer-events-none"
                              style={{
                                left: `${leftPos}%`,
                                width: `${widthPos}%`,
                                top: `${topPos}px`,
                                height: '18px',
                                backgroundColor: bgColor,
                                color: textColor,
                                borderLeft: isEventStartWeek ? `3px solid ${borderColor}` : undefined,
                                borderRadius: isSingleDayPreview ? '4px' : (isEventStartWeek ? '4px 0 0 4px' : '0'),
                                boxShadow: `0 0 0 2px ${borderColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                                zIndex: 20,
                              }}
                            >
                              {isEventStartWeek && !isSingleDayPreview && <span className="truncate flex-1">{extendingEvent.title}</span>}
                              {isSingleDayPreview && <span className="text-[8px] opacity-70">1 day</span>}
                            </div>
                          );
                        } else if (dragOverDate > weekEndStr) {
                          // This is a week BEFORE the cursor week - show full bar to end of week
                          const leftPos = (startCol / 7) * 100 + 0.3;
                          const widthPos = ((7 - startCol) / 7) * 100 - 0.6;
                          
                          return (
                            <div
                              className="absolute flex items-center px-2 text-[10px] font-medium pointer-events-none"
                              style={{
                                left: `${leftPos}%`,
                                width: `${widthPos}%`,
                                top: `${topPos}px`,
                                height: '18px',
                                backgroundColor: bgColor,
                                color: textColor,
                                borderLeft: isEventStartWeek ? `3px solid ${borderColor}` : undefined,
                                borderRadius: isEventStartWeek ? '4px 0 0 4px' : '0',
                                boxShadow: `0 0 0 2px ${borderColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                                zIndex: 20,
                              }}
                            >
                              {isEventStartWeek && <span className="truncate flex-1">{extendingEvent.title}</span>}
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Event Popup */}
      {addingToDate && (
        <AddEventPopup
          dateStr={addingToDate}
          onClose={() => setAddingToDate(null)}
          onAdd={handleAddEvent}
        />
      )}
    </div>
  );
}

