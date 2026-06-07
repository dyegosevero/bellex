import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await authClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem excluir clientes" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id } = await req.json();
    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify client exists
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("id, full_name")
      .eq("id", client_id)
      .maybeSingle();

    if (clientError) throw clientError;
    if (!client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get all appointment IDs for this client
    const { data: appointments } = await adminClient
      .from("appointments")
      .select("id")
      .eq("client_id", client_id);

    const appointmentIds = (appointments ?? []).map((a: any) => a.id);

    // 2. Get all charge IDs for this client
    const { data: charges } = await adminClient
      .from("charges")
      .select("id")
      .eq("client_id", client_id);

    const chargeIds = (charges ?? []).map((c: any) => c.id);

    // 3. Delete appointment-related records (deepest first)
    if (appointmentIds.length > 0) {
      await Promise.all([
        adminClient.from("appointment_form_responses").delete().in("appointment_id", appointmentIds),
        adminClient.from("appointment_products").delete().in("appointment_id", appointmentIds),
        adminClient.from("appointment_services").delete().in("appointment_id", appointmentIds),
        adminClient.from("appointment_feedback").delete().in("appointment_id", appointmentIds),
        adminClient.from("appointment_anamnesis").delete().in("appointment_id", appointmentIds),
        adminClient.from("client_consents").delete().in("appointment_id", appointmentIds),
        adminClient.from("client_images").delete().in("appointment_id", appointmentIds),
        adminClient.from("google_calendar_syncs").delete().in("appointment_id", appointmentIds),
      ]);
    }

    // 4. Delete charge-related records
    if (chargeIds.length > 0) {
      await Promise.all([
        adminClient.from("charge_items").delete().in("charge_id", chargeIds),
        adminClient.from("charge_sends").delete().in("charge_id", chargeIds),
      ]);
    }

    // 5. Delete records that reference client_id directly (parallel)
    await Promise.all([
      // Charges (after charge_items/sends are gone)
      adminClient.from("charges").delete().eq("client_id", client_id),
      // Appointments (after all appointment sub-records are gone)
      adminClient.from("appointments").delete().eq("client_id", client_id),
      // Client sub-records
      adminClient.from("client_consents").delete().eq("client_id", client_id),
      adminClient.from("client_documents").delete().eq("client_id", client_id),
      adminClient.from("client_images").delete().eq("client_id", client_id),
      adminClient.from("appointment_anamnesis").delete().eq("client_id", client_id),
      adminClient.from("appointment_feedback").delete().eq("client_id", client_id),
      // Notification & campaign records
      adminClient.from("notification_logs").delete().eq("client_id", client_id),
      adminClient.from("campaign_recipients").delete().eq("client_id", client_id),
    ]);

    // 6. Finally delete the client
    const { error: deleteClientError } = await adminClient
      .from("clients")
      .delete()
      .eq("id", client_id);

    if (deleteClientError) throw deleteClientError;

    console.log(`[delete-client] Client ${client_id} (${client.full_name}) deleted by ${caller.id}`);

    return new Response(JSON.stringify({ success: true, deleted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("delete-client error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
