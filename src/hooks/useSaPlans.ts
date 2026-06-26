import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SaPlan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  seats: number;
  storage_gb: number;
  ai_conversations_month: number;
  color: string;
  features: string[];
  popular: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function useSaPlans() {
  const [plans, setPlans] = useState<SaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("workspace_plans")
      .select("*")
      .order("sort_order");
    if (!error && data) setPlans(data as SaPlan[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function update(id: string, payload: Partial<SaPlan>) {
    const { error } = await supabase
      .from("workspace_plans")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Erro ao salvar plano"); return false; }
    toast.success("Plano salvo!");
    await load();
    return true;
  }

  return { plans, loading, update, reload: load };
}
