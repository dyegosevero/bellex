/**
 * POST /functions/v1/leads-webhook
 *
 * Body: { name: string, phone?: string, email?: string, source?: string, message?: string }
 *
 * Flow:
 * 1. Find "Novo Lead" stage (position 0)
 * 2. Create lead in that stage
 * 3. Create conversation linked to lead
 * 4. Store initial message if provided
 * 5. If stage has agent_enabled, send AI welcome message via Evolution API
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, phone, email, source = "webhook", message } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Find "Novo Lead" stage (position 0)
    const { data: stage, error: stageErr } = await supabase
      .from("pipeline_stages")
      .select("*")
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (stageErr || !stage) {
      return new Response(JSON.stringify({ error: "No pipeline stages found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        name,
        phone: phone ?? null,
        email: email ?? null,
        source,
        stage_id: stage.id,
        last_message: message ?? null,
        archived: false,
      })
      .select()
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Failed to create lead", details: leadErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Determine channel from source
    const channel = source === "instagram" ? "instagram" : "whatsapp";

    // 4. Create conversation
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .insert({ lead_id: lead.id, channel, status: "open" })
      .select()
      .single();

    if (convErr || !conversation) {
      return new Response(JSON.stringify({ error: "Failed to create conversation", details: convErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Store initial message if provided
    if (message) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        text: message,
        from_me: false,
        status: "delivered",
      });
    }

    // 6. If stage has agent enabled, send welcome message via Evolution API
    let agentMessageSent = false;
    if (stage.agent_enabled && stage.agent_prompt && phone) {
      try {
        const welcomeText = stage.agent_prompt.replace(/\{nome\}/gi, name);

        // Get Evolution API instance
        const { data: instance } = await supabase
          .from("whatsapp_instances")
          .select("*")
          .eq("status", "connected")
          .limit(1)
          .single();

        if (instance) {
          const evolutionRes = await fetch(
            `${instance.api_url}/message/sendText/${instance.instance_name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: instance.api_key ?? "",
              },
              body: JSON.stringify({
                number: phone.replace(/\D/g, ""),
                text: welcomeText,
              }),
            }
          );

          if (evolutionRes.ok) {
            // Store agent message in conversation
            await supabase.from("messages").insert({
              conversation_id: conversation.id,
              text: welcomeText,
              from_me: true,
              status: "sent",
            });
            agentMessageSent = true;
          }
        }
      } catch (agentErr) {
        console.error("Agent welcome message failed:", agentErr);
        // Non-fatal: lead and conversation were created successfully
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        conversation_id: conversation.id,
        stage: stage.label,
        agent_message_sent: agentMessageSent,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
