import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkspaceCustomer = {
  id: string;
  owner_id: string;
  client_name: string;
  plan: string;
  seats_total: number;
  seats_used: number;
  license_key: string;
  license_type: "anual" | "vitalicia";
  valid_until: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  coupon_code: string | null;
  status: "ativo" | "trial" | "expirando" | "suspenso" | "cancelado";
  created_at: string;
  updated_at: string;
};

export type NewWorkspaceCustomer = {
  client_name: string;
  plan: string;
  seats_total: number;
  license_type: "anual" | "vitalicia";
  valid_until: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
};

export function useSaWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("workspace_customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setWorkspaces((data as WorkspaceCustomer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (ws: NewWorkspaceCustomer) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };
    const { data, error: err } = await supabase
      .from("workspace_customers")
      .insert({ ...ws, owner_id: user.id, status: "trial" })
      .select()
      .single();
    if (!err) setWorkspaces(prev => [data as WorkspaceCustomer, ...prev]);
    return { data, error: err?.message };
  };

  const update = async (id: string, patch: Partial<WorkspaceCustomer>) => {
    const { data, error: err } = await supabase
      .from("workspace_customers")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (!err) setWorkspaces(prev => prev.map(w => w.id === id ? data as WorkspaceCustomer : w));
    return { data, error: err?.message };
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("workspace_customers").delete().eq("id", id);
    if (!err) setWorkspaces(prev => prev.filter(w => w.id !== id));
    return { error: err?.message };
  };

  return { workspaces, loading, error, refetch: fetch, create, update, remove };
}
