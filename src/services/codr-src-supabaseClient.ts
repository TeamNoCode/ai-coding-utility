// ====================================================
//  VERSION: codr-src
//  FILE: src/services/codr-src-supabaseClient.ts
// ====================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A more robust check to see if Supabase is actually configured.
// It checks for presence, non-empty strings, and default placeholder values.
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('pkmepwdgopqrwmcinryo'); // Check against the known placeholder URL

// Create a Supabase client instance, which will be null if not configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Export a boolean to easily check in components if Supabase is available
export const supabaseEnabled = isSupabaseConfigured;