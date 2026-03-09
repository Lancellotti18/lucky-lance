import { createClient } from "@supabase/supabase-js";

// Server-side admin client — uses service role key, bypasses RLS
// ONLY import this in API routes (src/app/api/*), never in client components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
