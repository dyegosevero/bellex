import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function lookupTxt(domain: string): Promise<string[]> {
  // Use Cloudflare DNS-over-HTTPS for TXT lookup
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`, {
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Answer ?? [])
    .filter((r: { type: number }) => r.type === 16)
    .map((r: { data: string }) => r.data.replace(/^"|"$/g, ""));
}

async function lookupCname(domain: string): Promise<string | null> {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`, {
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const answer = (data.Answer ?? []).find((r: { type: number }) => r.type === 5);
  return answer?.data?.replace(/\.$/, "") ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { domain, subdomain, verify_token } = await req.json();
    if (!domain || !verify_token) {
      return new Response(JSON.stringify({ error: "domain e verify_token obrigatórios" }), { status: 400, headers: corsHeaders });
    }

    // Check TXT record: bellex-verify=<token>
    const txtRecords = await lookupTxt(domain);
    const expectedTxt = `bellex-verify=${verify_token}`;
    const txtVerified = txtRecords.some(r => r === expectedTxt);

    // Check CNAME: domain -> <subdomain>.bellex.app
    const cnameTarget = await lookupCname(domain);
    const expectedCname = subdomain ? `${subdomain}.bellex.app` : "app.bellex.app";
    const cnameVerified = cnameTarget === expectedCname;

    return new Response(JSON.stringify({
      txt_verified: txtVerified,
      cname_verified: cnameVerified,
      verified: txtVerified && cnameVerified,
      txt_found: txtRecords,
      cname_found: cnameTarget,
    }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
