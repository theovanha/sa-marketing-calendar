import { supabase } from './supabase';
import type { Brand, CalendarEvent } from './types';

// ============================================
// Supabase Service - Database Operations
// ============================================

// Brand operations
export const brandService = {
  async getAll(): Promise<Brand[]> {
    // #region agent log H2
    console.log('[SUPABASE_DEBUG] brandService.getAll - hasClient:', !!supabase);
    // #endregion
    if (!supabase) {
      console.log('[SUPABASE_DEBUG] brandService.getAll - client is NULL, returning empty');
      return [];
    }
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    
    // #region agent log H4
    console.log('[SUPABASE_DEBUG] brandService.getAll result:', { hasData: !!data, count: data?.length, error: error?.message });
    // #endregion
    if (error) throw error;
    
    return (data || []).map(b => ({
      id: b.id,
      name: b.name,
      logo: b.logo || undefined,
      primaryColor: b.primary_color,
      timezone: b.timezone,
      archived: b.archived,
      createdAt: b.created_at,
    }));
  },

  async create(brand: Brand): Promise<void> {
    // #region agent log H3
    console.log('[SUPABASE_DEBUG] brandService.create:', { brandId: brand.id, name: brand.name, hasClient: !!supabase });
    // #endregion
    if (!supabase) {
      console.log('[SUPABASE_DEBUG] brandService.create - client is NULL, skipping save');
      return;
    }
    const { error } = await supabase.from('brands').insert({
      id: brand.id,
      name: brand.name,
      logo: brand.logo || null,
      primary_color: brand.primaryColor,
      timezone: brand.timezone,
      archived: brand.archived || false,
      created_at: brand.createdAt,
    });
    // #region agent log H5
    console.log('[SUPABASE_DEBUG] brandService.create result:', { success: !error, error: error?.message });
    // #endregion
    if (error) throw error;
  },

  async update(id: string, updates: Partial<Brand>): Promise<void> {
    if (!supabase) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.logo !== undefined) dbUpdates.logo = updates.logo || null;
    if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
    if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
    
    const { error } = await supabase.from('brands').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
  },
};

// Event operations
export const eventService = {
  async getAll(): Promise<CalendarEvent[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(e => ({
      id: e.id,
      brandId: e.brand_id,
      title: e.title,
      type: e.type as CalendarEvent['type'],
      startDate: e.start_date,
      endDate: e.end_date || undefined,
      tags: e.tags || [],
      importance: e.importance as CalendarEvent['importance'],
      visibility: e.visibility as CalendarEvent['visibility'],
      channels: e.channels || undefined,
      objective: e.objective || undefined,
      notes: e.notes || undefined,
      links: e.links || undefined,
      recurrence: e.recurrence || undefined,
    }));
  },

  async create(event: CalendarEvent): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('events').insert({
      id: event.id,
      brand_id: event.brandId,
      title: event.title,
      type: event.type,
      start_date: event.startDate,
      end_date: event.endDate || null,
      tags: event.tags,
      importance: event.importance,
      visibility: event.visibility,
      channels: event.channels || null,
      objective: event.objective || null,
      notes: event.notes || null,
      links: event.links || null,
      recurrence: event.recurrence || null,
    });
    if (error) throw error;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<void> {
    if (!supabase) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
    if (updates.channels !== undefined) dbUpdates.channels = updates.channels || null;
    if (updates.objective !== undefined) dbUpdates.objective = updates.objective || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    
    const { error } = await supabase.from('events').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteByBrandId(brandId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('events').delete().eq('brand_id', brandId);
    if (error) throw error;
  },
};

// Hidden events operations
export const hiddenEventService = {
  async getByBrand(brandId: string): Promise<string[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('hidden_events')
      .select('event_id')
      .eq('brand_id', brandId);
    
    if (error) throw error;
    return (data || []).map(h => h.event_id);
  },

  async getAll(): Promise<Record<string, string[]>> {
    if (!supabase) return {};
    const { data, error } = await supabase
      .from('hidden_events')
      .select('brand_id, event_id');
    
    if (error) throw error;
    
    const result: Record<string, string[]> = {};
    (data || []).forEach(h => {
      if (!result[h.brand_id]) result[h.brand_id] = [];
      result[h.brand_id].push(h.event_id);
    });
    return result;
  },

  async hide(brandId: string, eventId: string): Promise<void> {
    if (!supabase) return;
    const id = `${brandId}-${eventId}`;
    const { error } = await supabase.from('hidden_events').upsert({
      id,
      brand_id: brandId,
      event_id: eventId,
    });
    if (error) throw error;
  },

  async unhide(brandId: string, eventId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('hidden_events')
      .delete()
      .eq('brand_id', brandId)
      .eq('event_id', eventId);
    if (error) throw error;
  },
};

// Month notes operations
export const monthNoteService = {
  async getAll(): Promise<Record<string, string>> {
    if (!supabase) return {};
    const { data, error } = await supabase
      .from('month_notes')
      .select('*');
    
    if (error) throw error;
    
    const result: Record<string, string> = {};
    (data || []).forEach(n => {
      const key = `${n.brand_id}-${n.year}-${n.month}`;
      result[key] = n.note;
    });
    return result;
  },

  async set(brandId: string, year: number, month: number, note: string): Promise<void> {
    if (!supabase) return;
    const id = `${brandId}-${year}-${month}`;
    const { error } = await supabase.from('month_notes').upsert({
      id,
      brand_id: brandId,
      year,
      month,
      note,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// Load all data from Supabase
export async function loadAllData(): Promise<{
  brands: Brand[];
  events: CalendarEvent[];
  hiddenEventsByBrand: Record<string, string[]>;
  monthNotes: Record<string, string>;
}> {
  const [brands, events, hiddenEventsByBrand, monthNotes] = await Promise.all([
    brandService.getAll(),
    eventService.getAll(),
    hiddenEventService.getAll(),
    monthNoteService.getAll(),
  ]);

  return { brands, events, hiddenEventsByBrand, monthNotes };
}

