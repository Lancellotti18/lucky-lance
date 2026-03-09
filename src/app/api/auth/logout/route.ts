import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("ll_session")?.value;

  if (token) {
    await supabaseAdmin.from("sessions").delete().eq("token", token);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
