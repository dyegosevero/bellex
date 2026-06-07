import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth via x-cron-secret (same pattern as reminder-callback, notification-callback)
    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");

    if (!cronSecret && !headerSecret) {
      // If no CRON_SECRET env var, check DB
      const tmpClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: cs } = await tmpClient
        .from("integration_settings")
        .select("setting_value")
        .eq("setting_key", "n8n_cron_secret")
        .maybeSingle();
      const dbSecret = cs?.setting_value;
      if (!dbSecret || dbSecret !== headerSecret) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (cronSecret && headerSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const items: any[] = Array.isArray(body) ? body : body.results || [];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Array de resultados vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let updated = 0;
    const errors: string[] = [];
    const campaignIds = new Set<string>();

    for (const item of items) {
      if (!item.campaign_id || !item.client_id || !item.status) {
        errors.push(`Item inválido: campaign_id, client_id e status são obrigatórios`);
        continue;
      }

      campaignIds.add(item.campaign_id);

      const updateData: Record<string, any> = {
        status: item.status,
      };

      if (item.status === "sent" || item.status === "delivered") {
        updateData.sent_at = item.sent_at || new Date().toISOString();
      }
      if (item.status === "failed" && item.error_message) {
        updateData.error_message = item.error_message;
      }
      if (item.status === "opened") {
        updateData.opened_at = item.sent_at || new Date().toISOString();
      }
      if (item.status === "clicked") {
        updateData.clicked_at = item.sent_at || new Date().toISOString();
      }

      const { error: upErr } = await adminClient
        .from("campaign_recipients")
        .update(updateData)
        .eq("campaign_id", item.campaign_id)
        .eq("client_id", item.client_id);

      if (upErr) {
        errors.push(`Erro ao atualizar ${item.client_id}: ${upErr.message}`);
      } else {
        updated++;
      }
    }

    // Recalculate campaign status for each affected campaign
    for (const campaignId of campaignIds) {
      const { data: recipients } = await adminClient
        .from("campaign_recipients")
        .select("status")
        .eq("campaign_id", campaignId);

      if (!recipients || recipients.length === 0) continue;

      const allStatuses = recipients.map((r: any) => r.status);
      const hasPending = allStatuses.some((s: string) => s === "pending");
      const hasFailed = allStatuses.some((s: string) => s === "failed");
      const allFailed = allStatuses.every((s: string) => s === "failed");
      const allDone = allStatuses.every((s: string) =>
        ["sent", "delivered", "opened", "clicked"].includes(s)
      );

      let campaignStatus: string;
      if (hasPending) {
        campaignStatus = "sending"; // still waiting for more callbacks
      } else if (allFailed) {
        campaignStatus = "failed";
      } else if (allDone) {
        campaignStatus = "sent";
      } else if (hasFailed) {
        campaignStatus = "partial";
      } else {
        campaignStatus = "sent";
      }

      await adminClient
        .from("campaigns")
        .update({
          status: campaignStatus,
          sent_at: hasPending ? undefined : new Date().toISOString(),
        })
        .eq("id", campaignId);
    }

    return new Response(
      JSON.stringify({ success: true, updated, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("campaign-callback error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
