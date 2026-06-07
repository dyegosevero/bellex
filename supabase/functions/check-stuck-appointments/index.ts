import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: x-cron-secret header (env + DB fallback) or admin user
  const incoming = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let cronAuth = false;
  let userAuth = false;

  if (incoming) {
    // 1st layer: check env var
    const envSecret = Deno.env.get("CRON_SECRET");
    if (envSecret && incoming === envSecret) {
      cronAuth = true;
    }
    // 2nd layer: check DB value (allows rotation via admin panel)
    if (!cronAuth) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: dbSecret } = await adminClient
        .from("integration_settings")
        .select("setting_value")
        .eq("setting_key", "n8n_cron_secret")
        .maybeSingle();
      if (dbSecret?.setting_value && incoming === dbSecret.setting_value) {
        cronAuth = true;
      }
    }
  }

  if (!cronAuth && authHeader) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (user) {
      const { data: roleData } = await anonClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) userAuth = true;
    }
  }

  if (!cronAuth && !userAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Find appointments with status 'em_andamento'
    const { data: stuckAppointments, error: apptErr } = await supabase
      .from("appointments")
      .select(`
        id,
        client_id,
        specialist_id,
        start_time,
        end_time,
        status,
        notes,
        clients!appointments_client_id_fkey (full_name, phone, email),
        appointment_services (
          service_id,
          services!appointment_services_service_id_fkey (name, duration_minutes)
        )
      `)
      .eq("status", "em_atendimento");

    if (apptErr) throw apptErr;
    if (!stuckAppointments || stuckAppointments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        warnings: [],
        auto_closed: [],
        message: "Nenhum atendimento pendente de finalização.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const warnings: any[] = [];
    const autoClosed: any[] = [];

    for (const appt of stuckAppointments) {
      // Calculate expected end time
      let expectedEnd: Date;

      if (appt.end_time) {
        expectedEnd = new Date(appt.end_time);
      } else {
        // Fallback: start_time + sum of service durations
        const totalDuration = (appt.appointment_services || []).reduce((sum: number, as_: any) => {
          return sum + (as_.services?.duration_minutes || 30);
        }, 0);
        expectedEnd = new Date(new Date(appt.start_time).getTime() + totalDuration * 60 * 1000);
      }

      const minutesOverdue = (now.getTime() - expectedEnd.getTime()) / (60 * 1000);

      if (minutesOverdue < 30) continue; // Not overdue yet

      // Get specialist name
      let specialistName: string | null = null;
      if (appt.specialist_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", appt.specialist_id)
          .maybeSingle();
        specialistName = profile?.full_name || null;
      }

      // Service names
      const serviceNames = (appt.appointment_services || [])
        .map((as_: any) => as_.services?.name)
        .filter(Boolean)
        .join(", ");

      const client = appt.clients as any;
      const entry = {
        appointment_id: appt.id,
        client_name: client?.full_name || "Sem nome",
        client_phone: client?.phone || null,
        client_email: client?.email || null,
        specialist_id: appt.specialist_id,
        specialist_name: specialistName,
        service_names: serviceNames,
        start_time: appt.start_time,
        expected_end: expectedEnd.toISOString(),
        minutes_overdue: Math.floor(minutesOverdue),
      };

      if (minutesOverdue >= 60) {
        // Auto-close: update status to 'concluido'
        const { error: updateErr } = await supabase
          .from("appointments")
          .update({
            status: "concluido",
            notes: (appt.notes || "") + "\n\n⚠️ Sessão encerrada automaticamente — tempo limite excedido.",
          })
          .eq("id", appt.id);

        if (!updateErr) {
          autoClosed.push({ ...entry, action: "auto_closed" });
        }
      } else {
        // Warning (30-59 min overdue)
        warnings.push({ ...entry, action: "warning" });
      }
    }

    // Fetch clinic name
    const { data: clinic } = await supabase
      .from("clinic_settings")
      .select("clinic_name")
      .limit(1)
      .maybeSingle();

    // Fetch admin and receptionist contacts for notifications
    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "atendimento"]);

    const staffContacts: any[] = [];
    if (staffRoles) {
      for (const r of staffRoles) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", r.user_id)
          .maybeSingle();
        const { data: { user } } = await supabase.auth.admin.getUserById(r.user_id);
        if (profile || user) {
          staffContacts.push({
            user_id: r.user_id,
            role: r.role,
            full_name: profile?.full_name || "",
            phone: profile?.phone || null,
            email: user?.email || null,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      clinic_name: clinic?.clinic_name || "Clínica",
      checked_at: now.toISOString(),
      warnings_count: warnings.length,
      auto_closed_count: autoClosed.length,
      warnings,
      auto_closed: autoClosed,
      notify_staff: staffContacts,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in check-stuck-appointments:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
