import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtglujrdhetwahbutzgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Z2x1anJkaGV0d2FoYnV0emd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTM4MDcsImV4cCI6MjA4NjUyOTgwN30._JOLowBH4bx0fKBF3uph8z3Y76uUEYUPP_FNAsEWPB0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
