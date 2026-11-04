import { createClient } from "@supabase/supabase-js";

const envUrl = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  ((globalThis as any)?.process?.env?.VITE_SUPABASE_URL) ||
  "https://mzmhfiaiaflsxkdpfdzl.supabase.co"
) as string;

const envKey = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  ((globalThis as any)?.process?.env?.VITE_SUPABASE_ANON_KEY) ||
  "sb_publishable_CCcsMk8dYy23TuOHjl6i-g_zsEcertW"
) as string;

export const isSupabaseConfigured = Boolean(
  envUrl && envKey && !envUrl.includes("placeholder")
);

const supabaseUrl = envUrl;
const supabaseAnonKey = envKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function supabaseConfigured() {
  return isSupabaseConfigured;
}
