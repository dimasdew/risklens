import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Fallback to publishable key for local dev / environments without service role
    const fallbackKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !fallbackKey) {
      throw new Error("Supabase server credentials are not configured.");
    }

    if (process.env.NODE_ENV === "production") {
      console.warn("[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set. Using publishable key. Set service role key for production.");
    }

    _client = createClient(url, fallbackKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    return _client;
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return _client;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(url && key);
}
