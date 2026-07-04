// ============================================
// SUPABASE CLIENT — Initialisation
// ============================================

const SUPABASE_URL = 'https://ootmtxgwmgfxhshvislo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdG10eGd3bWdmeGhzaHZpc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDYwOTcsImV4cCI6MjA5NzcyMjA5N30.f3VVhI6iC3CtxLaRpmYX7q8v83jFb9zBuo-ZPhD6M_c';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase connecté à', SUPABASE_URL);
