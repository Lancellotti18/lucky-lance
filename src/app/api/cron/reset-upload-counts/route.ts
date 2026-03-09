import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin.from("users").update({
    upload_count: 0,
    last_limit_reset_date: new Date().toISOString(),
  }).neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, resetAt: new Date().toISOString() });
}
