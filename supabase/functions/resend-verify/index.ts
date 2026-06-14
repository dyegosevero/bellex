import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { api_key } = await req.json();
    if (!api_key) return new Response(JSON.stringify({ error: "api_key obrigatória" }), { status: 400, headers: corsHeaders });

    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${api_key}` },
    });

    if (res.ok) {
      return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ valid: false, error: "Chave inválida" }), { status: 200, headers: corsHeaders });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
