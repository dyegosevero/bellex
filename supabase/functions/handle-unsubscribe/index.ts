import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    // token kept for backward compatibility
    const token = url.searchParams.get("token");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let client: any = null;
    let fetchErr: any = null;

    if (email) {
      // New flow: find client by email
      const res = await supabase
        .from("clients")
        .select("id, full_name, opt_in")
        .eq("email", email)
        .maybeSingle();
      client = res.data;
      fetchErr = res.error;
    } else if (token) {
      // Legacy flow: token = client_id (UUID)
      const res = await supabase
        .from("clients")
        .select("id, full_name, opt_in")
        .eq("id", token)
        .maybeSingle();
      client = res.data;
      fetchErr = res.error;
    } else {
      return new Response(JSON.stringify({ error: "Parâmetro obrigatório em falta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (fetchErr || !client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!client.opt_in) {
      return new Response(
        JSON.stringify({ success: true, already_unsubscribed: true, name: client.full_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateErr } = await supabase
      .from("clients")
      .update({ opt_in: false })
      .eq("id", client.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Erro ao cancelar subscrição" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, already_unsubscribed: false, name: client.full_name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("handle-unsubscribe error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
