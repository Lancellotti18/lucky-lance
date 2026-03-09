import type { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-server";

export interface SessionUser {
  id: string;
  email: string;
  first_name: string;
  subscription_plan: string;
  upload_count: number;
  monthly_upload_limit: number | null;
  founder_status: boolean;
  payment_status: string;
}

const COOKIE_NAME = "ll_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select(
      "id, email, first_name, subscription_plan, upload_count, monthly_upload_limit, founder_status, payment_status"
    )
    .eq("id", session.user_id)
    .single();

  return user ?? null;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
