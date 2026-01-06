'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarEvent, EVENT_TYPE_COLORS } from '@/lib/types';
import { formatDate, formatDateRange, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Flag, GraduationCap, BookOpen, Sun, Star, Target, Rocket, X, Check } from 'lucide-react';

interface EventPillProps {
  event: CalendarEvent;
  compact?: boolean;
}

const TYPE_ICONS: Record<string, typeof Flag> = {
  publicHoliday: Flag,
  schoolTerm: GraduationCap,
  backToSchool: BookOpen,
  season: Sun,
  culture: Star,
  brandMoment: Target,
  campaignFlight: Rocket,
  keyDate: Star, // Key dates use star icon
};

export function EventPill({ event, compact = false }: EventPillProps) {
  const { updateEvent, deleteEvent } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(event.title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const colorClass = EVENT_TYPE_COLORS[event.type] || 'gray';
  const Icon = TYPE_ICONS[event.type] || Star;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(event.title);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== event.title) {
      updateEvent(event.id, { title: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(event.title);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEvent(event.id);
  };

  const isRange = event.endDate && event.endDate !== event.startDate;
  
  // Styling rules based on event type:
  // - Brand = white (highlighted)
  // - Campaign = yellow (highlighted)
  // - Key Date, School, Season, Public Holiday, Culture = gray
  const isBrandMoment = event.type === 'brandMoment';
  const isCampaign = event.type === 'campaignFlight';
  const isHighlightedType = isBrandMoment || isCampaign;
  const isPublicHoliday = event.type === 'publicHoliday';
  const isGlobalEvent = event.brandId === null;
  
  // VANHA green for public holidays, yellow for campaigns, white for brand, gray for others
  const textColor = isPublicHoliday 
    ? '#00F59B'  // VANHA green for public holidays
    : isCampaign
      ? '#FACC15'  // Yellow for campaigns
      : isBrandMoment
        ? '#ffffff'  // White for Brand
        : '#a1a1aa'; // Gray for Key Date, School, Season, etc.

  // Format date with day abbreviation: "5 Fri"
  const formatDayWithWeekday = (dateStr: string) => {
    return formatDate(dateStr, 'd EEE'); // e.g., "5 Fri"
  };

  if (isEditing) {
    return (
      <div className={cn(
        'event-pill w-full flex items-center gap-1.5',
        `event-pill-${colorClass}`,
        isPublicHoliday && 'event-pill-holiday-green'
      )}>
        <Icon className="w-3 h-3 shrink-0 opacity-60" />
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-white text-xs min-w-0"
        />
        <button
          onClick={handleSave}
          className="p-0.5 rounded hover:bg-white/20 text-green-400"
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onDoubleClick={handleDoubleClick}
        className={cn(
          'event-pill w-full text-left flex items-center gap-1.5 pr-6 cursor-pointer',
          `event-pill-${colorClass}`,
          !isHighlightedType && !isPublicHoliday && 'event-pill-muted',
          isPublicHoliday && 'event-pill-holiday-green'
        )}
        title={`${event.title} - ${formatDateRange(event.startDate, event.endDate)} (double-click to edit)`}
      >
        <Icon className={cn('w-3 h-3 shrink-0', !isHighlightedType && !isPublicHoliday ? 'opacity-60' : '')} style={{ color: textColor }} />
        <span className="truncate flex-1" style={{ color: textColor }}>{event.title}</span>
        {!compact && (
          <span className={cn('text-[10px] shrink-0 font-mono', !isHighlightedType ? 'opacity-50' : 'opacity-70')}>
            {formatDayWithWeekday(event.startDate)}
            {isRange && `–${formatDayWithWeekday(event.endDate!)}`}
          </span>
        )}
      </div>
      
      {/* Delete button on hover */}
      <button
        onClick={handleDelete}
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full',
          'flex items-center justify-center',
          'bg-surface-900/80 hover:bg-red-500 text-surface-400 hover:text-white',
          'transition-all duration-150',
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        )}
        title="Remove from calendar"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Range bar for campaign flights that span multiple days
interface RangeBarProps {
  event: CalendarEvent;
  monthStart: number;
  monthEnd: number;
}

export function RangeBar({ event }: RangeBarProps) {
  const { openDrawer, selectEvent } = useAppStore();

  const handleClick = () => {
    selectEvent(event.id);
    openDrawer('view', event.id);
  };

  const channelColors: Record<string, string> = {
    Meta: '#1877f2',
    Google: '#ea4335',
    TikTok: '#000000',
    CRM: '#10b981',
    YouTube: '#ff0000',
    Influencers: '#e1306c',
  };

  return (
    <button
      onClick={handleClick}
      className="w-full group relative"
      title={`${event.title} - ${formatDateRange(event.startDate, event.endDate)}`}
    >
      <div className="range-bar from-campaign/60 to-campaign/30" />
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[10px] text-surface-400 truncate">{event.title}</span>
        {event.channels && event.channels.length > 0 && (
          <div className="flex gap-0.5">
            {event.channels.slice(0, 3).map((channel) => (
              <div
                key={channel}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: channelColors[channel] || '#6b7280' }}
                title={channel}
              />
            ))}
            {event.channels.length > 3 && (
              <span className="text-[9px] text-surface-500">+{event.channels.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

