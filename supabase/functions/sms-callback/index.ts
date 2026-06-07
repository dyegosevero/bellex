import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseUrlEncoded(text: string): Record<string, string> {
  const params = new URLSearchParams(text);
  const obj: Record<string, string> = {};
  params.forEach((v, k) => { obj[k] = v; });
  return obj;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const raw = await req.text();
    console.log("[sms-callback] raw body:", raw);

    let body: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      body = JSON.parse(raw);
    } else if (contentType.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
      body = parseUrlEncoded(raw);
    } else {
      try {
        body = JSON.parse(raw);
      } catch {
        body = parseUrlEncoded(raw);
      }
    }

    console.log("[sms-callback] parsed:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const messageId = (body.message_id || body.messageId || body.trackingId || null) as string | null;
    const status = (body.status || body.Status || "unknown") as string;
    const phone = (body.to || body.phone || "") as string;

    if (messageId) {
      const { data: existing } = await admin
        .from("sms_logs")
        .select("id")
        .eq("message_id", messageId)
        .maybeSingle();

      if (existing) {
        await admin
          .from("sms_logs")
          .update({
            status,
            callback_data: body,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("sms_logs").insert({
          message_id: messageId,
          phone,
          status,
          callback_data: body,
        });
      }
    } else {
      // No message_id — just log it
      await admin.from("sms_logs").insert({
        phone,
        status,
        callback_data: body,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sms-callback] error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
