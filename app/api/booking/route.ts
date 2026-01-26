import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      service,
      date,
      slotId,
      duration,
      couponCode,
      discountAmount,
      finalAmount,
      location, // Destructured location from body
      form: { name, phone, email, payment },
      paymentDetails,
    } = body;

    /* ---------- VALIDATION ---------- */
    if (
      !service?.id ||
      !service?.title ||
      !date ||
      !slotId ||
      !duration ||
      !name ||
      !phone ||
      !email ||
      !payment ||
      finalAmount == null
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    /* ---------- STORE BOOKING ---------- */
    const { data: booking, error: dbError } = await supabase
      .from("bookings")
      .insert({
        service_id: service.id,
        service_title: service.title,
        slot_id: slotId,
        duration_minutes: duration,
        booking_date: date,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        payment_method: payment,
        coupon_code: couponCode ?? null,
        discount_amount: discountAmount ?? 0,
        final_amount: finalAmount,
        amount: finalAmount, 
        status: payment === "QR" ? "confirmed" : "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB ERROR:", dbError);
      throw dbError;
    }

    /* ---------- STORE PAYMENT LOG ---------- */
    if (payment === "QR" && paymentDetails && booking) {
      const { error: paymentError } = await supabase.from("payments").insert({
        booking_id: booking.id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id ?? null,
        razorpay_signature: paymentDetails.razorpay_signature ?? null,
        amount: finalAmount,
        status: "captured",
      });

      if (paymentError) console.error("PAYMENT LOG ERROR:", paymentError);
    }

    /* ---------- SEND CONFIRMATION EMAIL VIA NODEMAILER ---------- */
    try {
      await transporter.sendMail({
        from: `"Chill Thrive Bookings" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Your Recovery Session: ${service.title}`,
        html: `
          <div style="background-color: #F9F9F9; padding: 5px 2.5px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #E5E7EB;">
              
              <div style="padding: 40px 40px 20px 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 600; tracking: -0.02em; color: #000000;">
                  <span style="color: #289BD0;">Chill</span> Thrive
                </h1>
                <p style="color: #9CA3AF; font-size: 16px; margin-top: 8px; font-weight: 300;">Recovery Meets Resilience</p>
              </div>

              <div style="padding: 0 40px 40px 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                   <h2 style="font-size: 24px; font-weight: 600; margin: 0; color: #111827;">Booking Confirmed</h2>
                   <p style="color: #4B5563; font-size: 15px; margin-top: 10px;">Hi ${name}, your session is all set.</p>
                </div>

                <div style="background-color: #F9F9F9; border-radius: 24px; padding: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Date</td>
                      <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${date}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Duration</td>
                      <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${duration} Minutes</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Payment</td>
                      <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${payment === "QR" ? "Online Pre-paid" : "Pay at Venue"}</td>
                    </tr>
                    <tr style="border-top: 1px solid #E5E7EB;">
                      <td style="padding: 20px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">Total Amount</td>
                      <td style="padding: 20px 0 0 0; color: #289BD0; font-size: 22px; font-weight: 700; text-align: right;">₹${finalAmount}</td>
                    </tr>
                  </table>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="https://maps.app.goo.gl/ZCg2QDuBpDRXRrDdA" 
                     style="display: inline-block; background-color: #289BD0; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
                    Get Directions →
                  </a>
                </div>

                <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 40px;">
                  Please arrive 10 minutes early. If you need to reschedule, reply to this email or contact us at ${process.env.GMAIL_USER}.
                </p>
              </div>

              <div style="background-color: #F9F9F9; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="color: #9CA3AF; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
                  &copy; ${new Date().getFullYear()} Chill Thrive. Verified Member Recovery.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("EMAIL ERROR:", emailError);
    }

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}