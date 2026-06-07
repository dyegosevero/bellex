import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DateRange {
  from: Date;
  to: Date;
}

export function useCharges(range: DateRange) {
  return useQuery({
    queryKey: ["reports-charges", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("*, clients(full_name), appointments(service_id, specialist_id, start_time, services(name)), charge_items(id, item_type, description, quantity, unit_price, product_id)")
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAppointments(range: DateRange) {
  return useQuery({
    queryKey: ["reports-appointments", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(full_name), services(name)")
        .gte("start_time", range.from.toISOString())
        .lte("start_time", range.to.toISOString())
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useClients(range: DateRange) {
  return useQuery({
    queryKey: ["reports-clients", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllCharges() {
  return useQuery({
    queryKey: ["reports-all-charges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("client_id, amount, status, paid_at")
        .eq("status", "pago");
      if (error) throw error;
      return data;
    },
  });
}

export function useAppointmentProducts(range: DateRange) {
  return useQuery({
    queryKey: ["reports-products", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name, stock_quantity, price), appointments!inner(start_time)")
        .gte("appointments.start_time", range.from.toISOString())
        .lte("appointments.start_time", range.to.toISOString());
      if (error) throw error;
      return data;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["reports-all-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["reports-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useInactiveClients() {
  return useQuery({
    queryKey: ["reports-inactive"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("inactive_clients");
      if (error) throw error;
      return data;
    },
  });
}
