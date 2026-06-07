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
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { token, reset_id, id, new_password } = await req.json();
    const normalizedToken = typeof token === "string" ? decodeURIComponent(token).trim() : "";
    const tokenId = typeof reset_id === "string" && reset_id ? reset_id : typeof id === "string" ? id : "";

    if ((!normalizedToken && !tokenId) || !new_password) {
      return new Response(JSON.stringify({ error: "Token e nova senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find token by stable row id when available, with legacy token fallback
    let tokenQuery = adminClient
      .from("password_reset_tokens")
      .select("*")
      .eq("used", false);

    if (tokenId) {
      tokenQuery = tokenQuery.eq("id", tokenId);
    } else {
      tokenQuery = tokenQuery.eq("token", normalizedToken);
    }

    const { data: tokenData, error: tokenErr } = await tokenQuery.maybeSingle();

    if (tokenErr) throw tokenErr;

    if (!tokenData || (normalizedToken && tokenData.token !== normalizedToken)) {
      return new Response(JSON.stringify({ error: "Token inválido ou já utilizado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      // Mark as used
      await adminClient.from("password_reset_tokens").update({ used: true }).eq("id", tokenData.id);
      return new Response(JSON.stringify({ error: "Token expirado. Solicite uma nova redefinição." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update password
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(tokenData.user_id, {
      password: new_password,
    });

    if (updateErr) throw updateErr;

    // Mark token as used
    await adminClient.from("password_reset_tokens").update({ used: true }).eq("id", tokenData.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
