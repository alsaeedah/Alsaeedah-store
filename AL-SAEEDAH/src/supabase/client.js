import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vyfdyzheokosikrxgepv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZmR5emhlb2tvc2lrcnhnZXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQwMzksImV4cCI6MjA5NzI5MDAzOX0.9mmi62ThbHkwEFoisUgIdYiLF-K5RNDkdvMuRdvkJKI';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
