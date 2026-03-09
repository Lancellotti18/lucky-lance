import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  verifyPassword,
  generateSessionToken,
  sessionExpiresAt,
} from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, password_hash, subscription_plan, upload_count, monthly_upload_limit, founder_status, payment_status"
      )
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Clean up old sessions for this user (optional hygiene)
    await supabaseAdmin
      .from("sessions")
      .delete()
      .eq("user_id", user.id)
      .lt("expires_at", new Date().toISOString());

    const token = generateSessionToken();
    await supabaseAdmin.from("sessions").insert({
      user_id: user.id,
      token,
      expires_at: sessionExpiresAt().toISOString(),
    });

    const response = NextResponse.json({
      userId: user.id,
      firstName: user.first_name,
      email: user.email,
      subscriptionPlan: user.subscription_plan,
      uploadCount: user.upload_count,
      monthlyUploadLimit: user.monthly_upload_limit,
      founderStatus: user.founder_status,
      paymentStatus: user.payment_status,
    });

    setSessionCookie(response, token);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
