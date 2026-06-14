import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkspaceClinic = {
  id: string;
  owner_id: string;
  name: string;
  client_name: string;
  subdomain: string;
  custom_domain: string | null;
  color: string;
  plan: "starter" | "pro" | "scale";
  status: "ativo" | "trial" | "inadimplente" | "suspenso" | "cancelado";
  created_at: string;
  updated_at: string;
};

export type NewWorkspaceClinic = Omit<WorkspaceClinic, "id" | "owner_id" | "created_at" | "updated_at">;

export function useWorkspaceClinics() {
  const [clinics, setClinics] = useState<WorkspaceClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("workspace_clinics")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setClinics((data as WorkspaceClinic[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (clinic: NewWorkspaceClinic) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };
    const { data, error: err } = await supabase
      .from("workspace_clinics")
      .insert({ ...clinic, owner_id: user.id })
      .select()
      .single();
    if (!err) setClinics(prev => [data as WorkspaceClinic, ...prev]);
    return { data, error: err?.message };
  };

  const update = async (id: string, patch: Partial<WorkspaceClinic>) => {
    const { data, error: err } = await supabase
      .from("workspace_clinics")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!err) setClinics(prev => prev.map(c => c.id === id ? data as WorkspaceClinic : c));
    return { data, error: err?.message };
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase
      .from("workspace_clinics")
      .delete()
      .eq("id", id);
    if (!err) setClinics(prev => prev.filter(c => c.id !== id));
    return { error: err?.message };
  };

  return { clinics, loading, error, refetch: fetch, create, update, remove };
}
