// Edge function: snapshot de storage por workspace (rodar diariamente via cron)
// Lê todos os buckets, agrupa arquivos pelo primeiro segmento do path (= clinic_auth_user_id),
// cruza com workspace_clinics e atualiza workspace_usage.storage_bytes

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MANAGEMENT_TOKEN    = Deno.env.get("SUPABASE_MANAGEMENT_TOKEN")!;

const BUCKETS = ["campaign-images", "consent-signatures", "consent-pdfs", "before-after"];
const PAGE_SIZE = 1000;

Deno.serve(async (req) => {
  // Aceita invocação manual (POST) ou via cron (GET)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Autenticação simples: secret compartilhado via header ou URL param
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Mapa: clinic_auth_user_id → total bytes
  const bytesPerUser = new Map<string, number>();

  for (const bucket of BUCKETS) {
    let offset = 0;
    while (true) {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list("", { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });

      if (error || !files || files.length === 0) break;

      for (const file of files) {
        // Arquivos no root do bucket = pastas (prefixos), não têm metadata.size
        // Precisamos listar dentro de cada pasta (= clinic_auth_user_id)
        if (!file.metadata) {
          // É uma pasta — lista os arquivos dentro dela
          const userId = file.name;
          let innerOffset = 0;
          while (true) {
            const { data: inner, error: innerErr } = await supabase.storage
              .from(bucket)
              .list(userId, { limit: PAGE_SIZE, offset: innerOffset });

            if (innerErr || !inner || inner.length === 0) break;

            for (const f of inner) {
              const size = (f.metadata as any)?.size ?? 0;
              bytesPerUser.set(userId, (bytesPerUser.get(userId) ?? 0) + size);
            }

            if (inner.length < PAGE_SIZE) break;
            innerOffset += PAGE_SIZE;
          }
        } else {
          // Arquivo direto na raiz sem pasta — ignora (não tem dono identificável)
        }
      }

      if (files.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  if (bytesPerUser.size === 0) {
    return new Response(JSON.stringify({ ok: true, message: "No files found", updated: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Busca mapeamento clinic_auth_user_id → workspace_clinics
  const userIds = [...bytesPerUser.keys()];
  const { data: clinics, error: clinicErr } = await supabase
    .from("workspace_clinics")
    .select("id, customer_id, clinic_auth_user_id")
    .in("clinic_auth_user_id", userIds);

  if (clinicErr) {
    return new Response(JSON.stringify({ ok: false, error: clinicErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const clinic of clinics ?? []) {
    if (!clinic.customer_id || !clinic.clinic_auth_user_id) continue;
    const bytes = bytesPerUser.get(clinic.clinic_auth_user_id) ?? 0;

    const { error: upsertErr } = await supabase.rpc("update_workspace_storage_bytes", {
      p_workspace_id: clinic.customer_id,
      p_clinic_id: clinic.id,
      p_bytes: bytes,
    });

    if (upsertErr) {
      errors.push(`${clinic.id}: ${upsertErr.message}`);
    } else {
      updated++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, updated, bytesPerUser: Object.fromEntries(bytesPerUser), errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
