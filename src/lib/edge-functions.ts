import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const EDGE_FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[invokeEdgeFunction] getSession error:", sessionError);
      return { data: null, error: new Error("Erro ao obter sessão. Faça login novamente.") };
    }

    const token = sessionData?.session?.access_token;

    if (!token) {
      console.warn("[invokeEdgeFunction] No access_token — user is not authenticated");
      return { data: null, error: new Error("Sessão expirada ou ausente. Faça login novamente.") };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${token}`,
    };

    const res = await fetch(`${EDGE_FUNCTIONS_BASE}/${functionName}`, {
      method: "POST",
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || data.message || `Erro HTTP ${res.status}`;
        console.error(`[invokeEdgeFunction] ${functionName} → ${res.status}:`, msg);
        return { data: null, error: new Error(msg) };
      }
      return { data: data as T, error: null };
    }

    const text = await res.text();
    if (!res.ok) {
      console.error(`[invokeEdgeFunction] ${functionName} → ${res.status}:`, text);
      return { data: null, error: new Error(text || `Erro HTTP ${res.status}`) };
    }
    return { data: text as any, error: null };
  } catch (err) {
    console.error("[invokeEdgeFunction] network/fetch error:", err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
