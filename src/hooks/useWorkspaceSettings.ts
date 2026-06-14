import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkspaceSettings = {
  id: string;
  owner_id: string;
  resend_key: string | null;
  resend_from: string;
  wp_token: string | null;
  wp_phone_id: string | null;
  brand_color: string;
  workspace_name: string;
  agent_enabled: boolean;
  agent_name: string;
  agent_prompt: string | null;
  notify_email: boolean;
  notify_whatsapp: boolean;
  updated_at: string;
};

export function useWorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    setSettings(data as WorkspaceSettings | null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (patch: Partial<Omit<WorkspaceSettings, "id" | "owner_id" | "updated_at">>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { data, error } = await supabase
      .from("workspace_settings")
      .upsert({ ...patch, owner_id: user.id }, { onConflict: "owner_id" })
      .select()
      .single();

    if (!error) setSettings(data as WorkspaceSettings);
    return { data, error: error?.message };
  };

  const testResend = async (api_key: string) => {
    const { data, error } = await supabase.functions.invoke("resend-verify", {
      body: { api_key },
    });
    if (error) return { valid: false, error: error.message };
    return data as { valid: boolean; error?: string };
  };

  return { settings, loading, save, testResend, refetch: fetch };
}
