import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get("appointment_id");

    if (!appointmentId) {
      return new Response("Missing appointment_id", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch appointment with service and client
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, client_id, service_id")
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) {
      return new Response("Appointment not found", { status: 404, headers: corsHeaders });
    }

    // Fetch service name
    let serviceName = "Agendamento";
    if (appt.service_id) {
      const { data: svc } = await supabase
        .from("services")
        .select("name")
        .eq("id", appt.service_id)
        .single();
      if (svc) serviceName = svc.name;
    }

    // Fetch client name
    let clientName = "";
    if (appt.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("full_name")
        .eq("id", appt.client_id)
        .single();
      if (client) clientName = client.full_name;
    }

    // Fetch clinic name
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("clinic_name")
      .limit(1)
      .maybeSingle();
    const clinicName = settings?.clinic_name || "Clínica";

    const normalizeProdId = (value: string) =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^A-Za-z0-9\- ]+/g, "")
        .replace(/\s+/g, "")
        .substring(0, 50) || "Clínica";

    const prodId =
      Deno.env.get("SUPABASE_ICS_PRODID") ||
      `-//${normalizeProdId(clinicName)}//Booking//PT`;

    // Format dates for iCalendar (UTC)
    const fmtDate = (iso: string) => {
      return new Date(iso)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    const dtStart = fmtDate(appt.start_time);
    const dtEnd = appt.end_time ? fmtDate(appt.end_time) : dtStart;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:${prodId}`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${appt.id}`,
      `SUMMARY:${serviceName}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `DESCRIPTION:${clientName} - ${clinicName}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(ics, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="marcacao-${appt.id}.ics"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
