import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  hashPassword,
  generateSessionToken,
  sessionExpiresAt,
} from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { firstName, email, password } = await request.json();

    if (!firstName || !email || !password) {
      return NextResponse.json(
        { error: "First name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check for existing user
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        password_hash: passwordHash,
      })
      .select(
        "id, email, first_name, subscription_plan, upload_count, monthly_upload_limit, founder_status, payment_status"
      )
      .single();

    if (error || !user) {
      throw new Error(error?.message || "Failed to create account.");
    }

    // Create session
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
    const message = err instanceof Error ? err.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
