import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      userId: user.id,
      firstName: user.first_name,
      email: user.email,
      subscriptionPlan: user.subscription_plan,
      uploadCount: user.upload_count,
      monthlyUploadLimit: user.monthly_upload_limit,
      founderStatus: user.founder_status,
      paymentStatus: user.payment_status,
    },
  });
}
