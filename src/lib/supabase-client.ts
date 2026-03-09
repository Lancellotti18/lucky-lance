"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side anon client — for future real-time use only
// Auth operations happen via API routes, not this client
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
