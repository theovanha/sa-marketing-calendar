'use client';

import { useState } from 'react';
import { CalendarEvent, EVENT_TYPE_COLORS } from '@/lib/types';
import { formatDate, formatDateRange, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Flag, GraduationCap, BookOpen, Sun, Star, Target, Rocket, X, Clock } from 'lucide-react';
import { EditEventModal } from './EditEventModal';

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
  deadline: Clock, // Deadline uses clock icon
};

export function EventPill({ event, compact = false }: EventPillProps) {
  const { deleteEvent } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const colorClass = EVENT_TYPE_COLORS[event.type] || 'gray';
  const Icon = TYPE_ICONS[event.type] || Star;

  const handleDoubleClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEvent(event.id);
  };

  const isRange = event.endDate && event.endDate !== event.startDate;
  
  // Styling rules based on event type:
  // - Brand = white (highlighted)
  // - Campaign = white (highlighted)
  // - Deadline = custom color
  // - Key Date, School, Season, Public Holiday, Culture = gray
  const isBrandMoment = event.type === 'brandMoment';
  const isCampaign = event.type === 'campaignFlight';
  const isDeadline = event.type === 'deadline';
  const isHighlightedType = isBrandMoment || isCampaign || isDeadline;
  const isPublicHoliday = event.type === 'publicHoliday';
  
  // Custom color for deadline, VANHA green for public holidays, white for brand & campaigns, gray for others
  const textColor = isDeadline && event.customColor
    ? event.customColor  // Custom color for deadlines
    : isPublicHoliday 
      ? '#00F59B'  // VANHA green for public holidays
      : (isCampaign || isBrandMoment)
        ? '#ffffff'  // White for Brand & Campaign
        : '#a1a1aa'; // Gray for Key Date, School, Season, etc.

  // Format date with day abbreviation: "5 Fri"
  const formatDayWithWeekday = (dateStr: string) => {
    return formatDate(dateStr, 'd EEE'); // e.g., "5 Fri"
  };

  // Format date range: "5 - 8 Jan" or "28 Jan - 2 Feb"
  const formatShortRange = (startDate: string, endDate: string) => {
    const startDay = formatDate(startDate, 'd');
    const endDay = formatDate(endDate, 'd');
    const startMonth = formatDate(startDate, 'MMM');
    const endMonth = formatDate(endDate, 'MMM');
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  // Generate inline styles for deadline events
  const deadlineStyles = isDeadline && event.customColor ? {
    backgroundColor: `${event.customColor}26`, // 15% opacity
    borderLeftColor: event.customColor,
  } : undefined;

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
        style={deadlineStyles}
        title={`${event.title} - ${formatDateRange(event.startDate, event.endDate)} (double-click to edit)`}
      >
        <Icon className={cn('w-3 h-3 shrink-0', !isHighlightedType && !isPublicHoliday ? 'opacity-60' : '')} style={{ color: textColor }} />
        <span className="truncate flex-1" style={{ color: textColor }}>{event.title}</span>
        {!compact && (
          <span className={cn('text-[10px] shrink-0 font-mono', !isHighlightedType ? 'opacity-50' : 'opacity-70')} style={isDeadline ? { color: textColor } : undefined}>
            {isRange 
              ? formatShortRange(event.startDate, event.endDate!)
              : formatDayWithWeekday(event.startDate)
            }
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

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <EditEventModal
          event={event}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
