import { NextResponse } from "next/server";
import { otpStore } from "../send/route";

export async function POST(req: Request) {
  const { email, otp } = await req.json();
  const stored = otpStore.get(email);

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  otpStore.delete(email); // One-time use
  return NextResponse.json({ success: true });
}