import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to call edge functions on the Supabase project.
 * Sends both Authorization and apikey headers for compatibility
 * with external Supabase deployments.
 */
const EDGE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // ---- Pre-flight: guarantee we have a valid session ----
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

    // ---- Build headers ----
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${token}`,
    };

    // ---- Make request ----
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

    // For non-JSON responses (SQL dumps, ICS files, etc.)
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
