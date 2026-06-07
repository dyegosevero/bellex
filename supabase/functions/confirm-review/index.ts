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

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(renderHTML(false, "Token em falta."), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find review request by token
  const { data: review, error } = await supabase
    .from("review_requests")
    .select("id, confirmed_at, client_id")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error || !review) {
    return new Response(renderHTML(false, "Link inválido ou expirado."), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (review.confirmed_at) {
    return new Response(renderHTML(true, "Já registámos a sua avaliação anteriormente. Obrigado! 🎉"), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Mark as confirmed
  await supabase
    .from("review_requests")
    .update({ confirmed_at: new Date().toISOString(), next_send_at: null })
    .eq("id", review.id);

  return new Response(
    renderHTML(true, "Obrigado por confirmar a sua avaliação! Muito obrigado pelo feedback. 🙏⭐"),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    }
  );
});

function renderHTML(success: boolean, message: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Avaliação Confirmada" : "Erro"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f0eb;
      color: #1a1a1a;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 15px; color: #666; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "⭐" : "⚠️"}</div>
    <h1>${success ? "Obrigado!" : "Ops..."}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
