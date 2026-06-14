import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WP_VERIFY_TOKEN") ?? "bellex-webhook-token";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Incoming events (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return new Response("ok", { status: 200 });

      const messages = value.messages ?? [];
      const statuses = value.statuses ?? [];
      const phone_number_id = value.metadata?.phone_number_id;

      // Log raw event for debugging
      await supabase.from("wp_webhook_events").insert({
        phone_number_id,
        payload: body,
        event_type: messages.length > 0 ? "message" : statuses.length > 0 ? "status" : "other",
      }).select();

      // Process incoming messages
      for (const msg of messages) {
        const from = msg.from;
        const text = msg.text?.body ?? msg.type;
        await supabase.from("wp_messages").insert({
          phone_number_id,
          from_number: from,
          message_id: msg.id,
          message_type: msg.type,
          content: text,
          timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
        }).select();
      }

      return new Response("ok", { status: 200 });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response("ok", { status: 200 }); // Always 200 to Meta
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
