// ====================================================
//  VERSION: 007-index
//  FILE: services/supabaseClient.ts
// ====================================================

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key.
// You can find these in your Supabase project settings under "API".
export const supabaseUrl = process.env.SUPABASE_URL || 'https://pkmepwdgopqrwmcinryo.supabase.co';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbWVwd2Rnb3BxcndtY2lucnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTk2ODYsImV4cCI6MjA3Mzc5NTY4Nn0.bkTQWSieOmXxozqorKljOlhEBAGEcz1Z7cNPk0umSfM';

// The original code threw an error if these weren't set.
// Now, the app loads and displays a configuration message if they are still placeholders.
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('Supabase credentials are not configured. Please update services/supabaseClient.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);