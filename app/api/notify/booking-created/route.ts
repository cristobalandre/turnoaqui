import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ✅ Importante:
// No crees el cliente Supabase en el top-level del módulo.
// Next/Vercel evalúa este archivo durante el build, y si faltan envs revienta.

function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();

  // Si faltan envs, NO lances error en top-level; aquí estamos dentro de una función.
  // Igual lanzamos para que el handler responda 500 claro.
  if (!supabaseUrl) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) environment variable"
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  let supabaseAdmin: SupabaseClient;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e: any) {
    // ✅ Error claro si faltan envs (y no tumba el build)
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const bookingId = body?.bookingId as string;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId missing" }, { status: 400 });
    }

    // 1) Traemos booking
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, org_id, start_at, end_at, service_id, room_id, client_id, client_name"
      )
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json(
        { error: bErr?.message || "booking not found" },
        { status: 404 }
      );
    }

    // 2) Traemos cliente (si existe)
    let client: any = null;
    if (booking.client_id) {
      const { data: c, error: cErr } = await supabaseAdmin
        .from("clients")
        .select("id, full_name, email, phone")
        .eq("id", booking.client_id)
        .single();

      if (!cErr) client = c;
    }

    const clientName = client?.full_name || booking.client_name || "Cliente";
    const email = client?.email || null;
    const phone = client?.phone || null;

    // ======= ARMAMOS MENSAJE =======
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);

    const msgText = `✅ Reserva confirmada\nCliente: ${clientName}\nInicio: ${start.toLocaleString(
      "es-CL"
    )}\nFin: ${end.toLocaleString(
      "es-CL"
    )}\n\nSi necesitas modificar tu hora responde este mensaje.`;

    // ================= Helpers =================

    async function wasAlreadySent(
      orgId: string,
      bookingId: string,
      channel: string,
      type: string,
      toValue: string
    ) {
      const { data } = await supabaseAdmin
        .from("notifications_log")
        .select("id")
        .eq("org_id", orgId)
        .eq("booking_id", bookingId)
        .eq("channel", channel)
        .eq("type", type)
        .eq("to_value", toValue)
        .limit(1);

      return (data?.length || 0) > 0;
    }

    async function logSent(
      orgId: string,
      bookingId: string,
      channel: string,
      type: string,
      toValue: string
    ) {
      await supabaseAdmin.from("notifications_log").insert([
        {
          org_id: orgId,
          booking_id: bookingId,
          channel,
          type,
          to_value: toValue,
          status: "sent",
        },
      ]);
    }

    // ⚡ EMAIL (ej: Resend / Sendgrid)
    async function sendEmail(to: string, subject: string, text: string) {
      console.log("EMAIL →", { to, subject, text });
    }

    // ⚡ SMS (ej: Twilio / WhatsApp)
    async function sendSMS(to: string, text: string) {
      console.log("SMS →", { to, text });
    }

    // ✅ 3) Enviar Email si tiene
    if (email) {
      const already = await wasAlreadySent(
        booking.org_id,
        booking.id,
        "email",
        "created",
        email
      );
      if (!already) {
        await sendEmail(email, "✅ Reserva confirmada", msgText);
        await logSent(booking.org_id, booking.id, "email", "created", email);
      }
    }

    // ✅ 4) Enviar SMS si tiene
    if (phone) {
      const already = await wasAlreadySent(
        booking.org_id,
        booking.id,
        "sms",
        "created",
        phone
      );
      if (!already) {
        await sendSMS(phone, msgText);
        await logSent(booking.org_id, booking.id, "sms", "created", phone);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "server error" },
      { status: 500 }
    );
  }
}
