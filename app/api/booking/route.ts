import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

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
      form: { name, phone, email, payment },
      paymentDetails, // Received from the Razorpay handler in frontend
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
    // Note: Use .select().single() to get the ID for the payment record
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
        amount: finalAmount, // Added to match your schema's default 0 field
        status: payment === "QR" ? "confirmed" : "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB ERROR:", dbError);
      throw dbError;
    }

    /* ---------- STORE PAYMENT LOG (If Razorpay) ---------- */
    if (payment === "QR" && paymentDetails && booking) {
      const { error: paymentError } = await supabase.from("payments").insert({
        booking_id: booking.id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id ?? null,
        razorpay_signature: paymentDetails.razorpay_signature ?? null,
        amount: finalAmount,
        status: "captured",
      });

      if (paymentError) {
        console.error("PAYMENT LOG ERROR:", paymentError);
        // We don't throw here so the user still sees their booking success
      }
    }

    /* ---------- SEND CONFIRMATION EMAIL ---------- */
    const { error: emailError } = await resend.emails.send({
      from: "Bookings <onboarding@resend.dev>",
      to: email,
      subject: "Booking Confirmed",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #289BD0;">Booking Confirmed!</h2>
          <p>Hi ${name}, your session has been successfully booked.</p>
          <hr />
          <p><strong>Service:</strong> ${service.title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Duration:</strong> ${duration} min</p>
          <p><strong>Payment Method:</strong> ${payment === "QR" ? "Paid Online" : "Pay at Venue"}</p>
          <p><strong>Total Amount:</strong> ₹${finalAmount}</p>
          <br />
          <p>Thank you for choosing us.</p>
        </div>
      `,
    });

    if (emailError) console.error("EMAIL ERROR:", emailError);

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}