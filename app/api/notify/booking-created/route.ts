import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 SOLO SERVER
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookingId = body?.bookingId as string;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId missing" }, { status: 400 });
    }

    // 1) Traemos booking
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("id, org_id, start_at, end_at, service_id, room_id, client_id, client_name")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: bErr?.message || "booking not found" }, { status: 404 });
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

    const msgText = `✅ Reserva confirmada
Cliente: ${clientName}
Inicio: ${start.toLocaleString("es-CL")}
Fin: ${end.toLocaleString("es-CL")}

Si necesitas modificar tu hora responde este mensaje.`;

    // ✅ 3) Enviar Email si tiene
    if (email) {
      const already = await wasAlreadySent(booking.org_id, booking.id, "email", "created", email);
      if (!already) {
        await sendEmail(email, "✅ Reserva confirmada", msgText);
        await logSent(booking.org_id, booking.id, "email", "created", email);
      }
    }

    // ✅ 4) Enviar SMS si tiene
    if (phone) {
      const already = await wasAlreadySent(booking.org_id, booking.id, "sms", "created", phone);
      if (!already) {
        await sendSMS(phone, msgText);
        await logSent(booking.org_id, booking.id, "sms", "created", phone);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}

// ================= Helpers =================

async function wasAlreadySent(orgId: string, bookingId: string, channel: string, type: string, toValue: string) {
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

async function logSent(orgId: string, bookingId: string, channel: string, type: string, toValue: string) {
  await supabaseAdmin.from("notifications_log").insert([
    { org_id: orgId, booking_id: bookingId, channel, type, to_value: toValue, status: "sent" }
  ]);
}

// ⚡ EMAIL (ej: Resend / Sendgrid)
// Ahora está en “mock”, pero ya listo para reemplazar
async function sendEmail(to: string, subject: string, text: string) {
  // ✅ Ejemplo con Resend (recomendado):
  // const resend = new Resend(process.env.RESEND_API_KEY!);
  // await resend.emails.send({
  //   from: "Agenda <notificaciones@tu-dominio.cl>",
  //   to,
  //   subject,
  //   text,
  // });

  console.log("EMAIL →", { to, subject, text });
}

// ⚡ SMS (ej: Twilio / WhatsApp)
// Ahora está en “mock”, pero ya listo para reemplazar
async function sendSMS(to: string, text: string) {
  // ✅ Ejemplo con Twilio:
  // const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);
  // await client.messages.create({
  //   from: process.env.TWILIO_FROM!,
  //   to,
  //   body: text,
  // });

  console.log("SMS →", { to, text });
}
