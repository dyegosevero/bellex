import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- Step 1: Extract Authorization header ---
    const authHeader = req.headers.get("Authorization");
    console.log("[delete-appointment] authHeader present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[delete-appointment] Missing or malformed Authorization header");
      return new Response(JSON.stringify({ error: "Header Authorization ausente ou inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 2: Validate user via getUser ---
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await authClient.auth.getUser();

    if (userError || !caller) {
      console.error("[delete-appointment] getUser failed:", userError?.message ?? "no user returned");
      return new Response(JSON.stringify({ error: "Token inválido — " + (userError?.message || "utilizador não encontrado") }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = caller.id;
    console.log("[delete-appointment] authenticated as:", callerId, caller.email);

    // --- Step 3: Permission check with admin client ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [adminCheck, specialistCheck] = await Promise.all([
      adminClient.rpc("is_admin", { _user_id: callerId }),
      adminClient.rpc("has_role", { _user_id: callerId, _role: "especialista" }),
    ]);

    if (adminCheck.error) throw adminCheck.error;
    if (specialistCheck.error) throw specialistCheck.error;

    const isAdmin = !!adminCheck.data;
    const isSpecialist = !!specialistCheck.data;

    console.log("[delete-appointment] roles — admin:", isAdmin, "specialist:", isSpecialist);

    if (!isAdmin && !isSpecialist) {
      return new Response(JSON.stringify({ error: "Sem permissão para excluir atendimentos" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 4: Parse body ---
    const { appointment_id } = await req.json();
    if (!appointment_id) {
      return new Response(JSON.stringify({ error: "appointment_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[delete-appointment] deleting appointment:", appointment_id);

    const { data: appointment, error: appointmentError } = await adminClient
      .from("appointments")
      .select("id, specialist_id")
      .eq("id", appointment_id)
      .maybeSingle();

    if (appointmentError) throw appointmentError;

    if (!appointment) {
      return new Response(JSON.stringify({ error: "Atendimento não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin && appointment.specialist_id !== callerId) {
      return new Response(JSON.stringify({ error: "Especialistas só podem excluir os próprios atendimentos" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 5: Cancel pending reminders directly in DB ---
    await adminClient
      .from("reminder_history")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("appointment_id", appointment_id)
      .in("status", ["pending", "dispatched"]);

    // --- Step 6: Delete related data ---
    const { data: charges, error: chargesError } = await adminClient
      .from("charges")
      .select("id")
      .eq("appointment_id", appointment_id);

    if (chargesError) throw chargesError;

    const relatedDeletes = await Promise.all([
      adminClient.from("appointment_feedback").delete().eq("appointment_id", appointment_id),
      adminClient.from("appointment_anamnesis").delete().eq("appointment_id", appointment_id),
      adminClient.from("appointment_form_responses").delete().eq("appointment_id", appointment_id),
      adminClient.from("appointment_products").delete().eq("appointment_id", appointment_id),
      adminClient.from("appointment_services").delete().eq("appointment_id", appointment_id),
      adminClient.from("client_consents").delete().eq("appointment_id", appointment_id),
      adminClient.from("client_images").delete().eq("appointment_id", appointment_id),
      adminClient.from("google_calendar_syncs").delete().eq("appointment_id", appointment_id),
    ]);

    for (const result of relatedDeletes) {
      if (result.error) throw result.error;
    }

    const chargeIds = (charges ?? []).map((charge) => charge.id);

    if (chargeIds.length > 0) {
      const chargeRelationDeletes = await Promise.all([
        adminClient.from("charge_items").delete().in("charge_id", chargeIds),
        adminClient.from("charge_sends").delete().in("charge_id", chargeIds),
      ]);

      for (const result of chargeRelationDeletes) {
        if (result.error) throw result.error;
      }

      const { error: deleteChargesError } = await adminClient
        .from("charges")
        .delete()
        .eq("appointment_id", appointment_id);

      if (deleteChargesError) throw deleteChargesError;
    }

    const { error: deleteAppointmentError } = await adminClient
      .from("appointments")
      .delete()
      .eq("id", appointment_id);

    if (deleteAppointmentError) throw deleteAppointmentError;

    console.log("[delete-appointment] success — appointment deleted:", appointment_id);

    return new Response(JSON.stringify({ success: true, deleted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[delete-appointment] error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
