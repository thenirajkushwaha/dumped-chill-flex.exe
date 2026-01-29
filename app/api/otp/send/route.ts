import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

// A simple in-memory store (For production, use Redis or Supabase table with TTL)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  const { email } = await req.json();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

  try {
    await transporter.sendMail({
      from: `"Chill Thrive" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `<div style="font-family:sans-serif; padding:20px; text-align:center;">
              <h2>Verification Code</h2>
              <p style="font-size:24px; font-weight:bold; letter-spacing:4px; color:#289BD0;">${otp}</p>
              <p>Valid for 5 minutes.</p>
             </div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}

// Export the store for the verify route to use
export { otpStore };