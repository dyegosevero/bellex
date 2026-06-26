import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ClinicPlan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  seats_limit: number;
  ai_conversations_month: number;
  storage_gb: number;
  color: string;
  popular: boolean;
  features: string[];
  active: boolean;
  sort_order: number;
  customer_id: string | null;
  created_at: string;
};

// Alias para compatibilidade com código existente
export type WorkspacePlan = ClinicPlan;

export function useWorkspacePlans(customerId?: string) {
  const [plans, setPlans] = useState<ClinicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let query = supabase
      .from("clinic_plans")
      .select("*")
      .eq("active", true)
      .order("sort_order");

    // Se customerId fornecido, retorna planos custom + planos globais (customer_id IS NULL)
    if (customerId) {
      query = query.or(`customer_id.eq.${customerId},customer_id.is.null`);
    } else {
      query = query.is("customer_id", null);
    }

    const { data, error } = await query;
    if (!error && data) setPlans(data as ClinicPlan[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [customerId]);

  async function create(payload: Omit<ClinicPlan, "id" | "created_at">) {
    const { error } = await supabase.from("clinic_plans").insert(payload);
    if (error) { toast.error("Erro ao criar plano"); return false; }
    toast.success("Plano criado!");
    await load();
    return true;
  }

  async function update(id: string, payload: Partial<ClinicPlan>) {
    const { error } = await supabase
      .from("clinic_plans")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Erro ao atualizar plano"); return false; }
    toast.success("Plano atualizado!");
    await load();
    return true;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("clinic_plans").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover plano"); return false; }
    toast.success("Plano removido!");
    await load();
    return true;
  }

  return { plans, loading, create, update, remove, reload: load };
}
