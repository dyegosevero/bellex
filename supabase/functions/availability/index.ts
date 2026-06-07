import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseIntervalMinutes(val: string | null | undefined, fallback: number): number {
  if (!val) return fallback;
  const v = val.trim().toLowerCase();
  if (v.endsWith("h")) return parseInt(v) * 60 || fallback;
  if (v.endsWith("m")) return parseInt(v) || fallback;
  return parseInt(v) || fallback;
}

/**
 * Get the UTC offset in minutes for a given IANA timezone on a specific date.
 * Positive = ahead of UTC (e.g. Europe/Lisbon DST = +60).
 */
function getTimezoneOffsetMinutes(timezone: string, dateStr: string): number {
  try {
    const dt = new Date(dateStr + "T12:00:00Z");
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(dt);
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0");
    const localDate = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")));
    return Math.round((localDate.getTime() - dt.getTime()) / 60000);
  } catch {
    return 0; // fallback to UTC
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const serviceId = url.searchParams.get("service_id");
    const date = url.searchParams.get("date");
    const durationOverride = url.searchParams.get("duration");
    const specialistIdParam = url.searchParams.get("specialist_id");

    if (!serviceId || !date) {
      return new Response(JSON.stringify({ error: "service_id and date are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch clinic settings
    const settingsPreRes = await supabase.from("clinic_settings").select("calendar_slot_interval, optimize_bookings, timezone, min_booking_lead").limit(1).single();
    const clinicTimezone = settingsPreRes.data?.timezone || "Europe/Lisbon";
    const minLeadMinutes = parseIntervalMinutes(settingsPreRes.data?.min_booking_lead, 30);
    const tzOffsetMin = getTimezoneOffsetMinutes(clinicTimezone, date);

    // Convert local midnight range to UTC for proper querying
    const dayStartUTC = new Date(new Date(`${date}T00:00:00Z`).getTime() - tzOffsetMin * 60000).toISOString();
    const dayEndUTC = new Date(new Date(`${date}T23:59:59Z`).getTime() - tzOffsetMin * 60000).toISOString();

    // Run ALL independent queries in parallel
    const [serviceRes, serviceSpecsRes, allRolesRes, apptsRes, blocksRes] = await Promise.all([
      supabase.from("services").select("id, name, duration_minutes").eq("id", serviceId).single(),
      supabase.from("service_specialists").select("specialist_id").eq("service_id", serviceId),
      supabase.from("user_roles").select("user_id").eq("role", "especialista"),
      supabase.from("appointments").select("specialist_id, start_time, end_time, services!appointments_service_id_fkey(duration_minutes)").gte("start_time", dayStartUTC).lte("start_time", dayEndUTC).neq("status", "cancelado"),
      supabase.from("calendar_blocks").select("specialist_id, start_datetime, end_datetime").lte("start_datetime", dayEndUTC).gte("end_datetime", dayStartUTC),
    ]);

    if (serviceRes.error || !serviceRes.data) {
      return new Response(JSON.stringify({ error: "Service not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = serviceRes.data;
    const duration = durationOverride ? parseInt(durationOverride, 10) : (service.duration_minutes || 30);
    const serviceSpecs = serviceSpecsRes.data ?? [];
    const allSpecialistIds = (allRolesRes.data ?? []).map((r: any) => r.user_id);
    const slotInterval = parseIntervalMinutes(settingsPreRes.data?.calendar_slot_interval, 30);

    // Get weekday in CLINIC timezone (not UTC)
    // Create a date at noon UTC, then adjust to clinic timezone to get the correct weekday
    const dateAtNoonUTC = new Date(date + "T12:00:00Z");
    const dateInClinicTz = new Date(dateAtNoonUTC.getTime() + tzOffsetMin * 60000);
    const weekday = dateInClinicTz.getUTCDay();

    // Now fetch business hours and specialist hours (depend on weekday)
    const [bizHoursRes] = await Promise.all([
      supabase.from("business_hours").select("start_time, end_time, active").eq("weekday", weekday).eq("active", true),
    ]);

    // Determine which specialists to check (always validate against known specialists)
    let specIds: string[];
    if (specialistIdParam) {
      // Only use if this specialist actually exists in the system
      specIds = allSpecialistIds.includes(specialistIdParam) ? [specialistIdParam] : [];
    } else if (serviceSpecs.length > 0) {
      specIds = serviceSpecs.map((s: any) => s.specialist_id).filter((id: string) => allSpecialistIds.includes(id));
    } else {
      specIds = allSpecialistIds;
    }

    if (specIds.length === 0) {
      return new Response(JSON.stringify({ slots: [], timezone: clinicTimezone }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bizIntervals: { start: string; end: string }[] = (bizHoursRes.data ?? []).map((h: any) => ({
      start: h.start_time,
      end: h.end_time,
    }));

    if (bizIntervals.length === 0) {
      return new Response(JSON.stringify({ slots: [], timezone: clinicTimezone }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profiles and specialist hours in parallel
    const [profilesRes, specHoursRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", specIds),
      supabase.from("specialist_hours").select("specialist_id, start_time, end_time").eq("weekday", weekday).in("specialist_id", specIds),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data ?? []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

    const specHoursMap: Record<string, { start: string; end: string }[]> = {};
    (specHoursRes.data ?? []).forEach((h: any) => {
      if (!specHoursMap[h.specialist_id]) specHoursMap[h.specialist_id] = [];
      specHoursMap[h.specialist_id].push({ start: h.start_time, end: h.end_time });
    });

    const existingAppts = apptsRes.data ?? [];
    const blocks = blocksRes.data ?? [];

    // Helper: convert "HH:MM" to minutes since midnight
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    // Pre-compute business hours range for clamping
    let bizMinStart = Infinity;
    let bizMaxEnd = 0;
    for (const bi of bizIntervals) {
      const s = toMin(bi.start);
      const e = toMin(bi.end);
      if (s < bizMinStart) bizMinStart = s;
      if (e > bizMaxEnd) bizMaxEnd = e;
    }

    /**
     * Convert local clinic time (minutes since midnight) to a proper UTC Date.
     * Business hours are stored in clinic local time, so we subtract the timezone offset.
     */
    const localMinToUTC = (min: number): Date => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      // Create a date in clinic local time, then convert to UTC
      const localMs = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`).getTime();
      return new Date(localMs - tzOffsetMin * 60000);
    };

    // Minimum booking time = now + min_booking_lead
    const nowPlusLead = new Date(Date.now() + minLeadMinutes * 60000);

    // Calculate available slots per specialist
    const slots: { start: string; end: string; specialist_id: string; specialist_name: string; local_time: string }[] = [];

    for (const specId of specIds) {
      let intervals = specHoursMap[specId] ?? bizIntervals;

      // Clamp specialist intervals to business hours range
      const clampedIntervals: { startMin: number; endMin: number }[] = [];
      for (const interval of intervals) {
        const s = Math.max(toMin(interval.start), bizMinStart);
        const e = Math.min(toMin(interval.end), bizMaxEnd);
        if (s < e) clampedIntervals.push({ startMin: s, endMin: e });
      }

      const specAppts = existingAppts
        .filter((a: any) => a.specialist_id === specId)
        .map((a: any) => {
          const apptDuration = a.services?.duration_minutes || 30;
          return {
            start: new Date(a.start_time).getTime(),
            end: a.end_time ? new Date(a.end_time).getTime() : new Date(a.start_time).getTime() + apptDuration * 60000,
          };
        });

      const specBlocks = blocks
        .filter((b: any) => b.specialist_id === specId)
        .map((b: any) => ({
          start: new Date(b.start_datetime).getTime(),
          end: new Date(b.end_datetime).getTime(),
        }));

      for (const { startMin, endMin } of clampedIntervals) {
        for (let min = startMin; min + duration <= endMin; min += slotInterval) {
          const slotStart = localMinToUTC(min);
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);

          const hasConflict = specAppts.some(
            (a: { start: number; end: number }) => slotStart.getTime() < a.end && slotEnd.getTime() > a.start
          );

          const hasBlock = specBlocks.some(
            (b: { start: number; end: number }) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start
          );

          if (!hasConflict && !hasBlock && slotStart >= nowPlusLead) {
            const localH = Math.floor(min / 60);
            const localM = min % 60;
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              specialist_id: specId,
              specialist_name: profileMap[specId] ?? "Especialista",
              local_time: `${String(localH).padStart(2, "0")}:${String(localM).padStart(2, "0")}`,
            });
          }
        }
      }
    }

    slots.sort((a, b) => a.start.localeCompare(b.start));

    return new Response(JSON.stringify({ slots, timezone: clinicTimezone }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
