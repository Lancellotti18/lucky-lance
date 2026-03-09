import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getSessionFromRequest } from "@/lib/session";

const PLAN_LIMITS: Record<string, number | null> = {
  pocket_pair: 75,
  the_flop: 175,
  the_nuts: 400,
};

const PLAN_NAMES: Record<string, string> = {
  pocket_pair: "The Pocket Pair",
  the_flop: "The Flop",
  the_nuts: "The Nuts",
};

export async function POST(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, billingCycle } = await request.json();

  if (!plan || !PLAN_LIMITS.hasOwnProperty(plan)) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  // PLACEHOLDER MODE: Activates plan without charging.
  // When Stripe is ready: create a PaymentIntent here, return clientSecret,
  // and activate plan only after webhook confirms payment_intent.succeeded.
  await supabaseAdmin
    .from("users")
    .update({
      subscription_plan: plan,
      monthly_upload_limit: PLAN_LIMITS[plan],
      payment_status: "active",
    })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    plan,
    planName: PLAN_NAMES[plan],
    billingCycle: billingCycle || "monthly",
    // When Stripe is live, return: clientSecret: paymentIntent.client_secret
  });
}
