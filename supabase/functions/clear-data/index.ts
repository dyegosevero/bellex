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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete in FK-safe order (deepest dependencies first)
    const tables = [
      // Appointment sub-records
      "appointment_form_responses",
      "appointment_products",
      "appointment_services",
      "appointment_feedback",
      "appointment_anamnesis",
      // Charge sub-records
      "charge_items",
      "charge_sends",
      // Client sub-records
      "client_consents",
      "client_documents",
      "client_images",
      // Notification & campaign records
      "notification_logs",
      "campaign_recipients",
      // Main records with FKs
      "charges",
      "google_calendar_syncs",
      "appointments",
      // Clients
      "clients",
      // Service-related (delete children before parents)
      "service_form_fields",
      "service_specialists",
      "specialist_services",
      "specialist_hours",
      "services",
      "service_categories",
      // Calendar
      "calendar_blocks",
      "calendar_feeds",
      // Campaigns
      "campaigns",
      // Products (delete products before categories)
      "products",
      "product_categories",
      // SMS logs
      "sms_logs",
    ];

    const results: Record<string, number> = {};

    for (const table of tables) {
      const { count } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });

      const { error } = await adminClient
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.error(`[clear-data] Error deleting ${table}:`, error.message);
        results[table] = -1;
      } else {
        results[table] = count || 0;
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[clear-data] error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
