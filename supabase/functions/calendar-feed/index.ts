import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatICSDate(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Extract token: /calendar-feed/clinic/{token}.ics or ?token=xxx
    let token = url.searchParams.get("token");

    const pathParts = url.pathname.split("/");
    // Find token in path - look for .ics suffix or last meaningful segment
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (part && part.endsWith(".ics")) {
        token = part.replace(".ics", "");
        break;
      }
      if (part && part !== "calendar-feed" && part !== "clinic" && part !== "v1" && part !== "functions") {
        token = part;
        break;
      }
    }

    if (!token) {
      return new Response("Token is required", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Look up the feed by token
    const { data: feed, error: feedError } = await supabase
      .from("calendar_feeds")
      .select("id, specialist_id, is_active, feed_type")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (feedError || !feed) {
      return new Response("Feed not found or inactive", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Get clinic name and timezone
    const { data: clinicSettings } = await supabase
      .from("clinic_settings")
      .select("clinic_name, timezone")
      .limit(1)
      .maybeSingle();

    const clinicName = clinicSettings?.clinic_name || "Clínica";
    const clinicTimezone = clinicSettings?.timezone || "Europe/Lisbon";

    // Fetch appointments for the next 90 days — ALL specialists
    const now = new Date();
    const futureLimit = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status, specialist_id, clients(full_name), services(name, duration_minutes)")
      .gte("start_time", now.toISOString())
      .lte("start_time", futureLimit.toISOString())
      .in("status", ["agendado", "em_atendimento", "realizado", "concluido"]);

    if (apptError) {
      console.error("Error fetching appointments:", apptError);
      return new Response("Error fetching appointments", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Get all specialist names for labeling
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");

    const specialistMap: Record<string, string> = {};
    for (const p of profiles || []) {
      specialistMap[p.user_id] = p.full_name || "Especialista";
    }

    // Fetch ALL calendar blocks
    const { data: blocks } = await supabase
      .from("calendar_blocks")
      .select("id, start_datetime, end_datetime, reason, specialist_id")
      .gte("start_datetime", now.toISOString())
      .lte("start_datetime", futureLimit.toISOString());

    // Build ICS content
    const events: string[] = [];

    for (const appt of appointments || []) {
      const clientName = (appt as any).clients?.full_name || "Cliente";
      const serviceName = (appt as any).services?.name || "Atendimento";
      const durationMin = (appt as any).services?.duration_minutes || 30;
      const specName = appt.specialist_id ? specialistMap[appt.specialist_id] || "Especialista" : "";

      const endTime =
        appt.end_time || new Date(new Date(appt.start_time).getTime() + durationMin * 60000).toISOString();

      const summary = specName ? `${serviceName} — ${specName}` : serviceName;

      events.push(
        `BEGIN:VEVENT\r\n` +
          `UID:${appt.id}@crm\r\n` +
          `DTSTART:${formatICSDate(appt.start_time)}\r\n` +
          `DTEND:${formatICSDate(endTime)}\r\n` +
          `SUMMARY:${escapeICS(summary)}\r\n` +
          `DESCRIPTION:Cliente: ${escapeICS(clientName)}\r\n` +
          `STATUS:CONFIRMED\r\n` +
          `END:VEVENT`,
      );
    }

    for (const block of blocks || []) {
      const specName = specialistMap[block.specialist_id] || "Especialista";
      events.push(
        `BEGIN:VEVENT\r\n` +
          `UID:block-${block.id}@crm\r\n` +
          `DTSTART:${formatICSDate(block.start_datetime)}\r\n` +
          `DTEND:${formatICSDate(block.end_datetime)}\r\n` +
          `SUMMARY:${escapeICS(block.reason || "Bloqueado")} — ${escapeICS(specName)}\r\n` +
          `STATUS:CONFIRMED\r\n` +
          `TRANSP:OPAQUE\r\n` +
          `END:VEVENT`,
      );
    }

    const icsContent =
      `BEGIN:VCALENDAR\r\n` +
      `VERSION:2.0\r\n` +
      `PRODID:-//CRM//Calendar Feed//PT\r\n` +
      `CALSCALE:GREGORIAN\r\n` +
      `METHOD:PUBLISH\r\n` +
      `X-WR-CALNAME:${clinicName} - Agenda\r\n` +
      `X-WR-TIMEZONE:${clinicTimezone}\r\n` +
      `REFRESH-INTERVAL;VALUE=DURATION:PT15M\r\n` +
      `X-PUBLISHED-TTL:PT15M\r\n` +
      events.join("\r\n") +
      (events.length > 0 ? "\r\n" : "") +
      `END:VCALENDAR\r\n`;

    return new Response(icsContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="agenda.ics"; filename*=UTF-8''${encodeURIComponent(clinicName.replace(/\s+/g, "_"))}.ics`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("calendar-feed error:", err);
    return new Response("Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
