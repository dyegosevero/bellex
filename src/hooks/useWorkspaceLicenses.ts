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
  status: "ativo" | "trial" | "expirando" | "suspenso" | "cancelado";
  created_at: string;
  updated_at: string;
};

// Alias para compatibilidade com código existente
export type WorkspaceLicense = WorkspaceCustomer;

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

export type NewWorkspaceLicense = NewWorkspaceCustomer;

export function useWorkspaceLicenses() {
  const [licenses, setLicenses] = useState<WorkspaceCustomer[]>([]);
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
    else setLicenses((data as WorkspaceCustomer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (lic: NewWorkspaceCustomer) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };
    const { data, error: err } = await supabase
      .from("workspace_customers")
      .insert({ ...lic, owner_id: user.id, status: "trial" })
      .select()
      .single();
    if (!err) setLicenses(prev => [data as WorkspaceCustomer, ...prev]);
    return { data, error: err?.message };
  };

  const update = async (id: string, patch: Partial<WorkspaceCustomer>) => {
    const { data, error: err } = await supabase
      .from("workspace_customers")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (!err) setLicenses(prev => prev.map(l => l.id === id ? data as WorkspaceCustomer : l));
    return { data, error: err?.message };
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("workspace_customers").delete().eq("id", id);
    if (!err) setLicenses(prev => prev.filter(l => l.id !== id));
    return { error: err?.message };
  };

  return { licenses, loading, error, refetch: fetch, create, update, remove };
}
