import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All public tables to dump (order matters for FK constraints)
const TABLES = [
  "clients",
  "services",
  "products",
  "product_categories",
  "profiles",
  "user_roles",
  "business_hours",
  "clinic_settings",
  "specialist_hours",
  "specialist_services",
  "service_specialists",
  "service_form_fields",
  "appointments",
  "appointment_services",
  "appointment_products",
  "appointment_feedback",
  "appointment_form_responses",
  "charges",
  "calendar_blocks",
  "calendar_feeds",
  "client_documents",
  "client_images",
  "google_calendar_syncs",
  "integration_settings",
  "message_templates",
  "notification_settings",
  "consent_texts",
  "booking_page_settings",
  "service_categories",
  "password_reset_tokens",
  "review_requests",
  "campaign_recipients",
  "campaigns",
  "notification_logs",
  "sms_logs",
  "charge_items",
  "charge_sends",
  "client_consents",
  "appointment_anamnesis",
];

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build SQL dump
    const lines: string[] = [];
    lines.push("-- ╔══════════════════════════════════════════════════╗");
    lines.push("-- ║  DATABASE DUMP — " + new Date().toISOString() + "  ║");
    lines.push("-- ╚══════════════════════════════════════════════════╝");
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");

    let totalRows = 0;

    for (const table of TABLES) {
      // Fetch all rows (paginated to avoid 1000-row limit)
      let allRows: Record<string, unknown>[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await adminClient
          .from(table)
          .select("*")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          lines.push(`-- ERROR reading ${table}: ${error.message}`);
          break;
        }

        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < pageSize) break;
        page++;
      }

      if (allRows.length === 0) {
        lines.push(`-- ${table}: 0 rows`);
        lines.push("");
        continue;
      }

      const columns = Object.keys(allRows[0]);
      lines.push(`-- ═══════════════ ${table} (${allRows.length} rows) ═══════════════`);
      lines.push(`DELETE FROM public.${table};`);

      for (const row of allRows) {
        const values = columns.map((col) => escapeSQL(row[col]));
        lines.push(
          `INSERT INTO public.${table} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`
        );
      }

      lines.push("");
      totalRows += allRows.length;
    }

    lines.push("COMMIT;");
    lines.push("");
    lines.push(`-- Total: ${totalRows} rows across ${TABLES.length} tables`);

    const sql = lines.join("\n");

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="dump_${new Date().toISOString().slice(0, 10)}.sql"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
