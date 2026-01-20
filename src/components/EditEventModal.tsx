'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { CalendarEvent, EventType } from '@/lib/types';
import { DEADLINE_COLORS, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';

// Event type options (Brand first, then Campaign, then Deadline)
const EVENT_TYPE_OPTIONS: { value: EventType; label: string; highlighted: boolean; hasColor?: boolean }[] = [
  { value: 'brandMoment', label: 'Brand', highlighted: true },
  { value: 'campaignFlight', label: 'Campaign', highlighted: true },
  { value: 'deadline', label: 'Deadline', highlighted: false, hasColor: true },
  { value: 'keyDate', label: 'Key Date', highlighted: false },
  { value: 'schoolTerm', label: 'School', highlighted: false },
  { value: 'season', label: 'Season', highlighted: false },
];

// Check if event type supports multi-day
const supportsMultiDay = (type: EventType) =>
  type === 'brandMoment' || type === 'campaignFlight' || type === 'deadline';

interface EditEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function EditEventModal({ event, onClose }: EditEventModalProps) {
  const { updateEvent, deleteEvent } = useAppStore();
  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.type);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate || '');
  const [deadlineColor, setDeadlineColor] = useState(event.customColor || DEADLINE_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset end date when switching to non-multi-day type
  useEffect(() => {
    if (!supportsMultiDay(eventType)) {
      setEndDate('');
    }
  }, [eventType]);

  const handleSave = () => {
    if (!title.trim()) return;

    const updates: Partial<CalendarEvent> = {
      title: title.trim(),
      type: eventType,
      startDate,
      endDate: endDate && endDate !== startDate ? endDate : undefined,
      customColor: eventType === 'deadline' ? deadlineColor : undefined,
    };

    updateEvent(event.id, updates);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this event? This cannot be undone.')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Format date for display
  const displayDate = format(new Date(startDate), 'EEEE, d MMMM yyyy');

  // Check if this is a global event (not editable)
  const isGlobalEvent = event.brandId === null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Event</h3>
            <p className="text-sm text-surface-400">{displayDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isGlobalEvent && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-400">
              This is a global event. Only the title can be edited. To change other details, create a brand-specific event instead.
            </p>
          </div>
        )}

        {/* Event Name Input */}
        <div className="mb-4">
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

        {/* Event Type Pills - Only for brand events */}
        {!isGlobalEvent && (
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
        )}

        {/* Color Picker for Deadline */}
        {!isGlobalEvent && eventType === 'deadline' && (
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

        {/* Date Pickers - Only for brand events */}
        {!isGlobalEvent && (
          <div className="mb-4">
            <label className="block text-xs text-surface-500 uppercase tracking-wider mb-2">
              Date
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-surface-500 mb-1">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Reset end date if it's before new start date
                    if (endDate && e.target.value > endDate) {
                      setEndDate('');
                    }
                  }}
                  className="w-full text-sm bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00F59B] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                />
              </div>
              {supportsMultiDay(eventType) && (
                <>
                  <div className="text-surface-500 pt-5">→</div>
                  <div className="flex-1">
                    <label className="block text-xs text-surface-500 mb-1">End (optional)</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-sm bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00F59B] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#00F59B', color: '#000' }}
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-surface-800 text-surface-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="w-full mt-3 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          Delete Event
        </button>
      </div>
    </div>
  );
}
