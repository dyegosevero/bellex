import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WorkspacePlan = {
  id: string;
  name: string;
  price: number;
  seats_limit: number;
  ai_conversations_month: number;
  storage_gb: number;
  color: string;
  popular: boolean;
  features: string[];
  active: boolean;
  created_at: string;
};

export function useWorkspacePlans() {
  const [plans, setPlans] = useState<WorkspacePlan[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("workspace_plans")
      .select("*")
      .order("price");
    if (!error && data) setPlans(data as WorkspacePlan[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create(payload: Omit<WorkspacePlan, "id" | "created_at">) {
    const { error } = await supabase.from("workspace_plans").insert(payload);
    if (error) { toast.error("Erro ao criar plano"); return false; }
    toast.success("Plano criado!");
    await load();
    return true;
  }

  async function update(id: string, payload: Partial<WorkspacePlan>) {
    const { error } = await supabase
      .from("workspace_plans")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Erro ao atualizar plano"); return false; }
    toast.success("Plano atualizado!");
    await load();
    return true;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("workspace_plans").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover plano"); return false; }
    toast.success("Plano removido!");
    await load();
    return true;
  }

  return { plans, loading, create, update, remove, reload: load };
}
