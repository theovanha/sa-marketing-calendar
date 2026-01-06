import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// #region agent log H1
console.log('[SUPABASE_DEBUG] Env vars:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey, 
  urlPrefix: supabaseUrl?.substring(0, 30) 
});
// #endregion

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// #region agent log H2
console.log('[SUPABASE_DEBUG] Client created:', !!supabase);
// #endregion

// Database types
export interface DbBrand {
  id: string;
  name: string;
  logo: string | null;
  primary_color: string;
  timezone: string;
  archived: boolean;
  created_at: string;
}

export interface DbEvent {
  id: string;
  brand_id: string | null;
  title: string;
  type: string;
  start_date: string;
  end_date: string | null;
  tags: string[];
  importance: string;
  visibility: string;
  channels: string[] | null;
  objective: string | null;
  notes: string | null;
  links: { label: string; url: string }[] | null;
  recurrence: { freq: string } | null;
  created_at: string;
}

export interface DbHiddenEvent {
  id: string;
  brand_id: string;
  event_id: string;
  created_at: string;
}

export interface DbMonthNote {
  id: string;
  brand_id: string;
  year: number;
  month: number;
  note: string;
  updated_at: string;
}

