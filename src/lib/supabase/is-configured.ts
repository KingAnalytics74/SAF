// Lets the app fall back to a read-only preview (mock data, no login) when
// no Supabase project is connected yet, instead of crashing on the missing
// env vars. Real auth takes over automatically once they're set.
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
