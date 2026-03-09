import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  const correctCode = process.env.FOUNDERS_CODE || "Ploverlucksout10-5";

  if (!code || code.trim() !== correctCode) {
    return NextResponse.json(
      { error: "Invalid founders code." },
      { status: 400 }
    );
  }

  await supabaseAdmin
    .from("users")
    .update({
      founder_status: true,
      subscription_plan: "founder",
      monthly_upload_limit: null,
      payment_status: "active",
    })
    .eq("id", user.id);

  return NextResponse.json({ success: true, founderStatus: true });
}
