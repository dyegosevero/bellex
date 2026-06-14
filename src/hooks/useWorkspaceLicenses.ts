import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkspaceLicense = {
  id: string;
  owner_id: string;
  client_name: string;
  plan: "starter" | "pro" | "scale";
  seats_total: number;
  seats_used: number;
  license_key: string;
  valid_until: string | null;
  status: "ativo" | "trial" | "expirando" | "suspenso" | "cancelado";
  created_at: string;
  updated_at: string;
};

export type NewWorkspaceLicense = Pick<WorkspaceLicense, "client_name" | "plan" | "seats_total" | "valid_until">;

export function useWorkspaceLicenses() {
  const [licenses, setLicenses] = useState<WorkspaceLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("workspace_licenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setLicenses((data as WorkspaceLicense[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (lic: NewWorkspaceLicense) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };
    const { data, error: err } = await supabase
      .from("workspace_licenses")
      .insert({ ...lic, owner_id: user.id, status: "trial" })
      .select()
      .single();
    if (!err) setLicenses(prev => [data as WorkspaceLicense, ...prev]);
    return { data, error: err?.message };
  };

  const update = async (id: string, patch: Partial<WorkspaceLicense>) => {
    const { data, error: err } = await supabase
      .from("workspace_licenses")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!err) setLicenses(prev => prev.map(l => l.id === id ? data as WorkspaceLicense : l));
    return { data, error: err?.message };
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("workspace_licenses").delete().eq("id", id);
    if (!err) setLicenses(prev => prev.filter(l => l.id !== id));
    return { error: err?.message };
  };

  return { licenses, loading, error, refetch: fetch, create, update, remove };
}
