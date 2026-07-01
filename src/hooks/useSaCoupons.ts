import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "fixed" | "percent";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
};

export function applyCoupon(price: number, coupon?: Coupon | null): number {
  if (!coupon || !coupon.active) return price;
  if (coupon.discount_type === "fixed") return Math.max(0, price - coupon.discount_value);
  return Math.max(0, price * (1 - coupon.discount_value / 100));
}

export function useSaCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("workspace_coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create(payload: Omit<Coupon, "id" | "used_count" | "created_at">) {
    const { error } = await supabase.from("workspace_coupons").insert(payload);
    if (error) { toast.error("Erro ao criar cupom"); return false; }
    toast.success("Cupom criado!");
    await load();
    return true;
  }

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase
      .from("workspace_coupons")
      .update({ active })
      .eq("id", id);
    if (error) { toast.error("Erro"); return; }
    await load();
  }

  return { coupons, loading, create, toggle, reload: load };
}
