import { createClient } from "@supabase/supabase-js";

const envUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) as string | undefined;
const envKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(
  envUrl && envKey && !envUrl.includes("placeholder")
);

// Use configured credentials, or safe fallback credentials for offline UI exploration
const supabaseUrl =
  envUrl || "https://placeholder-synaptra.supabase.co";
const supabaseAnonKey =
  envKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder";

if (!isSupabaseConfigured && typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  console.info(
    "ℹ️ [SYNAPTRA] Supabase environment variables not set or pointing to placeholder. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to your live database."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function supabaseConfigured() {
  return isSupabaseConfigured;
}

