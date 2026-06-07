import { supabase } from "@/integrations/supabase/client";

interface Slot {
  start: string;
  end: string;
  specialist_id: string;
  specialist_name: string;
  local_time: string;
}

function parseIntervalMinutes(val: string | null | undefined, fallback: number): number {
  if (!val) return fallback;
  const v = val.trim().toLowerCase();
  if (v.endsWith("h")) return parseInt(v) * 60 || fallback;
  if (v.endsWith("m")) return parseInt(v) || fallback;
  return parseInt(v) || fallback;
}

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
    return 0;
  }
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export async function fetchAvailability(params: {
  serviceId: string;
  date: string;
  specialistId?: string | null;
  durationOverride?: number | null;
}): Promise<{ slots: Slot[]; timezone: string }> {
  const { serviceId, date, specialistId, durationOverride } = params;

  // Get weekday (JS: 0=Sun)
  const dateObj = new Date(date + "T12:00:00Z");

  // Run ALL independent queries in parallel
  const [serviceRes, serviceSpecsRes, allRolesRes, apptsRes, blocksRes, settingsRes] = await Promise.all([
    supabase.from("services").select("id, name, duration_minutes").eq("id", serviceId).single(),
    supabase.from("service_specialists").select("specialist_id").eq("service_id", serviceId),
    supabase.from("user_roles").select("user_id").eq("role", "especialista"),
    supabase.from("appointments").select("specialist_id, start_time, end_time").gte("start_time", `${date}T00:00:00`).lte("start_time", `${date}T23:59:59`).neq("status", "cancelado"),
    supabase.from("calendar_blocks").select("specialist_id, start_datetime, end_datetime").lte("start_datetime", `${date}T23:59:59`).gte("end_datetime", `${date}T00:00:00`),
    supabase.from("clinic_settings").select("calendar_slot_interval, optimize_bookings, timezone").limit(1).single(),
  ]);

  if (serviceRes.error || !serviceRes.data) {
    throw new Error("Service not found");
  }

  const service = serviceRes.data;
  const duration = durationOverride || service.duration_minutes || 30;
  const serviceSpecs = serviceSpecsRes.data ?? [];
  const allSpecialistIds = (allRolesRes.data ?? []).map((r) => r.user_id);
  const slotInterval = parseIntervalMinutes(settingsRes.data?.calendar_slot_interval, 30);
  const clinicTimezone = settingsRes.data?.timezone || "Europe/Lisbon";
  const tzOffsetMin = getTimezoneOffsetMinutes(clinicTimezone, date);

  // Get weekday in clinic timezone
  const dateInClinicTz = new Date(dateObj.getTime() + tzOffsetMin * 60000);
  const weekday = dateInClinicTz.getUTCDay();

  // Determine which specialists to check (always validate against known specialists)
  let specIds: string[];
  if (specialistId) {
    specIds = allSpecialistIds.includes(specialistId) ? [specialistId] : [];
  } else if (serviceSpecs.length > 0) {
    specIds = serviceSpecs.map((s) => s.specialist_id).filter((id) => allSpecialistIds.includes(id));
  } else {
    specIds = allSpecialistIds;
  }

  if (specIds.length === 0) {
    return { slots: [], timezone: clinicTimezone };
  }

  // Fetch business hours, profiles, specialist hours (depend on weekday/specIds)
  const [bizHoursRes, profilesRes, specHoursRes] = await Promise.all([
    supabase.from("business_hours").select("start_time, end_time, active").eq("weekday", weekday).eq("active", true),
    supabase.from("profiles").select("user_id, full_name").in("user_id", specIds),
    supabase.from("specialist_hours").select("specialist_id, start_time, end_time").eq("weekday", weekday).in("specialist_id", specIds),
  ]);

  const bizIntervals = (bizHoursRes.data ?? []).map((h) => ({
    start: h.start_time,
    end: h.end_time,
  }));

  if (bizIntervals.length === 0) {
    return { slots: [], timezone: clinicTimezone };
  }

  const profileMap: Record<string, string> = {};
  (profilesRes.data ?? []).forEach((p) => { profileMap[p.user_id] = p.full_name; });

  const specHoursMap: Record<string, { start: string; end: string }[]> = {};
  (specHoursRes.data ?? []).forEach((h) => {
    if (!specHoursMap[h.specialist_id]) specHoursMap[h.specialist_id] = [];
    specHoursMap[h.specialist_id].push({ start: h.start_time, end: h.end_time });
  });

  const existingAppts = apptsRes.data ?? [];
  const blocks = blocksRes.data ?? [];

  // Pre-compute business hours range
  let bizMinStart = Infinity;
  let bizMaxEnd = 0;
  for (const bi of bizIntervals) {
    const s = toMin(bi.start);
    const e = toMin(bi.end);
    if (s < bizMinStart) bizMinStart = s;
    if (e > bizMaxEnd) bizMaxEnd = e;
  }

  const localMinToUTC = (min: number): Date => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const localMs = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`).getTime();
    return new Date(localMs - tzOffsetMin * 60000);
  };

  const slots: Slot[] = [];

  for (const specId of specIds) {
    const intervals = specHoursMap[specId] ?? bizIntervals;

    const clampedIntervals: { startMin: number; endMin: number }[] = [];
    for (const interval of intervals) {
      const s = Math.max(toMin(interval.start), bizMinStart);
      const e = Math.min(toMin(interval.end), bizMaxEnd);
      if (s < e) clampedIntervals.push({ startMin: s, endMin: e });
    }

    const specAppts = existingAppts
      .filter((a) => a.specialist_id === specId)
      .map((a) => ({
        start: new Date(a.start_time).getTime(),
        end: a.end_time ? new Date(a.end_time).getTime() : new Date(a.start_time).getTime() + duration * 60000,
      }));

    const specBlocks = blocks
      .filter((b) => b.specialist_id === specId)
      .map((b) => ({
        start: new Date(b.start_datetime).getTime(),
        end: new Date(b.end_datetime).getTime(),
      }));

    for (const { startMin, endMin } of clampedIntervals) {
      for (let min = startMin; min + duration <= endMin; min += slotInterval) {
        const slotStart = localMinToUTC(min);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        const hasConflict = specAppts.some(
          (a) => slotStart.getTime() < a.end && slotEnd.getTime() > a.start
        );

        const hasBlock = specBlocks.some(
          (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start
        );

        if (!hasConflict && !hasBlock) {
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

  return { slots, timezone: clinicTimezone };
}
