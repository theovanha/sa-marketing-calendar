'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Rocket,
  Target,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Lightbulb,
  FileText,
  Image,
  Zap,
} from 'lucide-react';
import { useAppStore, useSelectedBrand, useSelectedEvent } from '@/lib/store';
import { Button, Input, Select } from './ui';
import {
  CalendarEvent,
  EventType,
  Importance,
  Visibility,
  Channel,
  Objective,
  EVENT_TEMPLATES,
  EventTemplate,
} from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { findPlanningPrompt, calculateCampaignDates } from '@/lib/planningPrompts';

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'brandMoment', label: 'Brand Moment' },
  { value: 'campaignFlight', label: 'Campaign Flight' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'keyDate', label: 'Key Date' },
  { value: 'publicHoliday', label: 'Public Holiday' },
  { value: 'schoolTerm', label: 'School Term' },
  { value: 'backToSchool', label: 'Back to School' },
  { value: 'season', label: 'Season' },
  { value: 'culture', label: 'Cultural Moment' },
];

const CHANNELS: Channel[] = ['Meta', 'Google', 'TikTok', 'CRM', 'YouTube', 'Influencers'];
const OBJECTIVES: Objective[] = ['Awareness', 'Leads', 'Sales'];
const IMPORTANCE_OPTIONS: Importance[] = ['high', 'med', 'low'];

interface FormData {
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  tags: string;
  importance: Importance;
  visibility: Visibility;
  channels: Channel[];
  objective: Objective | '';
  notes: string;
  recurrence: boolean;
}

const DEFAULT_FORM: FormData = {
  title: '',
  type: 'brandMoment',
  startDate: '',
  endDate: '',
  tags: '',
  importance: 'med',
  visibility: 'client',
  channels: [],
  objective: '',
  notes: '',
  recurrence: false,
};

export function EventDrawer() {
  const {
    drawerOpen,
    drawerMode,
    selectedYear,
    closeDrawer,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useAppStore();

  const selectedBrand = useSelectedBrand();
  const selectedEvent = useSelectedEvent();

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);

  // Reset form when drawer opens/closes or mode changes
  useEffect(() => {
    if (drawerOpen) {
      if (drawerMode === 'view' || drawerMode === 'edit') {
        if (selectedEvent) {
          setForm({
            title: selectedEvent.title,
            type: selectedEvent.type,
            startDate: selectedEvent.startDate,
            endDate: selectedEvent.endDate || '',
            tags: selectedEvent.tags.join(', '),
            importance: selectedEvent.importance,
            visibility: selectedEvent.visibility,
            channels: selectedEvent.channels || [],
            objective: selectedEvent.objective || '',
            notes: selectedEvent.notes || '',
            recurrence: !!selectedEvent.recurrence,
          });
        }
      } else {
        // Add mode - reset form with sensible defaults
        const today = new Date();
        const defaultDate = `${selectedYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setForm({
          ...DEFAULT_FORM,
          startDate: defaultDate,
        });
        setSelectedTemplate(null);
      }
    }
  }, [drawerOpen, drawerMode, selectedEvent, selectedYear]);

  const handleTemplateSelect = (templateId: EventTemplate) => {
    const template = EVENT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setForm((prev) => ({
        ...prev,
        type: template.defaultType,
        recurrence: template.defaultRecurrence,
        title: template.label,
      }));
    }
  };

  const handleChannelToggle = (channel: Channel) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.startDate) return;

    const eventData: Omit<CalendarEvent, 'id'> = {
      brandId: selectedBrand?.id || null,
      title: form.title.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      importance: form.importance,
      visibility: form.visibility,
      channels: form.type === 'campaignFlight' ? form.channels : undefined,
      objective: form.type === 'campaignFlight' && form.objective ? form.objective : undefined,
      notes: form.notes || undefined,
      recurrence: form.recurrence ? { freq: 'yearly' } : undefined,
    };

    if (drawerMode === 'edit' && selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      createEvent(eventData);
    }

    closeDrawer();
  };

  const handleDelete = () => {
    if (selectedEvent && confirm('Delete this event? This cannot be undone.')) {
      deleteEvent(selectedEvent.id);
      closeDrawer();
    }
  };

  const isEditing = drawerMode === 'edit';
  const isViewing = drawerMode === 'view';
  const isCampaign = form.type === 'campaignFlight';

  return (
    <>
      {/* Overlay */}
      {drawerOpen && <div className="overlay" onClick={closeDrawer} />}

      {/* Drawer */}
      <aside className={cn('drawer', drawerOpen ? 'drawer-open' : 'drawer-closed')}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-surface-100">
              {drawerMode === 'add'
                ? 'Add Event'
                : drawerMode === 'edit'
                ? 'Edit Event'
                : 'Event Details'}
            </h2>
            <Button variant="ghost" size="icon" onClick={closeDrawer}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Quick templates (only in add mode) */}
            {drawerMode === 'add' && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className="p-3 rounded-lg border text-left transition-all"
                      style={selectedTemplate === template.id 
                        ? { borderColor: '#00F59B', backgroundColor: 'rgba(0, 245, 155, 0.1)', color: '#00F59B' }
                        : { borderColor: '#3f3f46', color: '#d4d4d8' }
                      }
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {template.isRange ? (
                          <Rocket className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{template.label}</span>
                      </div>
                      <p className="text-xs text-surface-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Title *
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Event title..."
                disabled={isViewing}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Type
              </label>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                disabled={isViewing}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  disabled={isViewing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  disabled={isViewing}
                  min={form.startDate}
                />
              </div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Importance
              </label>
              <div className="flex gap-2">
                {IMPORTANCE_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() => !isViewing && setForm({ ...form, importance: level })}
                    disabled={isViewing}
                    className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={form.importance === level
                      ? { borderColor: '#00F59B', backgroundColor: 'rgba(0, 245, 155, 0.1)', color: '#00F59B' }
                      : { borderColor: '#3f3f46', color: '#a1a1aa' }
                    }
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => !isViewing && setForm({ ...form, visibility: 'client' })}
                  disabled={isViewing}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={form.visibility === 'client'
                    ? { borderColor: '#00F59B', backgroundColor: 'rgba(0, 245, 155, 0.1)', color: '#00F59B' }
                    : { borderColor: '#3f3f46', color: '#a1a1aa' }
                  }
                >
                  <Eye className="w-4 h-4" />
                  Client
                </button>
                <button
                  onClick={() => !isViewing && setForm({ ...form, visibility: 'internal' })}
                  disabled={isViewing}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={form.visibility === 'internal'
                    ? { borderColor: '#00F59B', backgroundColor: 'rgba(0, 245, 155, 0.1)', color: '#00F59B' }
                    : { borderColor: '#3f3f46', color: '#a1a1aa' }
                  }
                >
                  <EyeOff className="w-4 h-4" />
                  Internal
                </button>
              </div>
            </div>

            {/* Campaign-specific fields */}
            {isCampaign && (
              <>
                {/* Channels */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Channels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((channel) => (
                      <button
                        key={channel}
                        onClick={() => !isViewing && handleChannelToggle(channel)}
                        disabled={isViewing}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          form.channels.includes(channel)
                            ? 'border-campaign bg-campaign/20 text-blue-300'
                            : 'border-surface-700 text-surface-400 hover:border-surface-600'
                        )}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Objective */}
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Objective
                  </label>
                  <Select
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value as Objective })}
                    disabled={isViewing}
                  >
                    <option value="">Select objective...</option>
                    {OBJECTIVES.map((obj) => (
                      <option key={obj} value={obj}>
                        {obj}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* Recurrence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-300">Repeat yearly</span>
              </div>
              <button
                onClick={() => !isViewing && setForm({ ...form, recurrence: !form.recurrence })}
                disabled={isViewing}
                className="w-12 h-6 rounded-full transition-all relative"
                style={{ backgroundColor: form.recurrence ? '#00F59B' : '#3f3f46' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.recurrence ? '28px' : '4px' }}
                />
              </button>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Tags (comma-separated)
              </label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="promo, sale, awareness..."
                disabled={isViewing}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add notes, creative angles, links..."
                disabled={isViewing}
                rows={4}
                className="input resize-none"
              />
            </div>

            {/* View mode: Planning prompt for anchor events */}
            {isViewing && selectedEvent && selectedEvent.type !== 'campaignFlight' && (() => {
              const prompt = findPlanningPrompt(selectedEvent.type, selectedEvent.title);
              if (!prompt) return null;
              
              const dates = calculateCampaignDates(selectedEvent.startDate, prompt);
              
              return (
                <div className="p-4 rounded-lg border" style={{ background: 'linear-gradient(to bottom right, rgba(0, 245, 155, 0.1), #1a1a1a)', borderColor: 'rgba(0, 245, 155, 0.3)' }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 245, 155, 0.2)' }}>
                      <Lightbulb className="w-4 h-4" style={{ color: '#00F59B' }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-surface-100">
                        {prompt.promptTitle}
                      </span>
                      <p className="text-xs text-surface-500">Planning Prompt</p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-surface-400 mb-4">
                    {prompt.promptDescription}
                  </p>
                  
                  {/* Lead times */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      <span className="text-surface-400">Start campaign:</span>
                      <span className="text-surface-200 font-medium">
                        {prompt.leadTimeDays} days before ({formatDate(dates.campaignStart, 'MMM d')})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-surface-500" />
                      <span className="text-surface-400">Brief due:</span>
                      <span className="text-surface-200 font-medium">
                        {formatDate(dates.briefDeadline, 'MMM d')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Image className="w-3.5 h-3.5 text-surface-500" />
                      <span className="text-surface-400">Assets due:</span>
                      <span className="text-surface-200 font-medium">
                        {formatDate(dates.assetsDeadline, 'MMM d')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Suggested channels */}
                  <div className="mb-4">
                    <span className="text-xs text-surface-500 block mb-1.5">Suggested channels:</span>
                    <div className="flex flex-wrap gap-1">
                      {prompt.suggestedChannels.map((channel) => (
                        <span
                          key={channel}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-campaign/20 text-blue-300"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Creative angle */}
                  <div className="mb-4">
                    <span className="text-xs text-surface-500 block mb-1">Creative angle:</span>
                    <p className="text-xs text-surface-300 italic">"{prompt.creativeAngle}"</p>
                  </div>
                  
                  {/* Offer pattern if available */}
                  {prompt.offerPattern && (
                    <div className="mb-4">
                      <span className="text-xs text-surface-500 block mb-1">Offer ideas:</span>
                      <p className="text-xs text-surface-300">{prompt.offerPattern}</p>
                    </div>
                  )}
                  
                  {/* Create flight button */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setForm({
                        ...DEFAULT_FORM,
                        title: `${selectedEvent.title} Campaign`,
                        type: 'campaignFlight',
                        startDate: dates.campaignStart,
                        endDate: dates.campaignEnd,
                        channels: prompt.suggestedChannels,
                        objective: 'Awareness',
                        notes: `Creative angle: ${prompt.creativeAngle}${prompt.offerPattern ? `\nOffer ideas: ${prompt.offerPattern}` : ''}`,
                      });
                      useAppStore.setState({ drawerMode: 'add', selectedEventId: null });
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    Create Campaign Flight
                  </Button>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface-800">
            {isViewing ? (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => useAppStore.setState({ drawerMode: 'edit' })}
                >
                  Edit
                </Button>
                <Button variant="danger" size="icon" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={closeDrawer}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!form.title.trim() || !form.startDate}
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

