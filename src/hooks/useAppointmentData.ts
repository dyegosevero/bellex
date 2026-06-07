import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  duration_minutes: number | null;
  price: number | null;
  color: string | null;
  display_order: number;
  category_id: string | null;
  requires_before_after_photos: boolean;
  requires_consent_form: boolean;
  requires_assessment_form: boolean;
}

export interface ServiceFormField {
  id: string;
  service_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .eq("archived", false)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });
}

/** Fetches ALL services (including inactive/archived) — use for name lookups */
export function useAllServices() {
  return useQuery({
    queryKey: ["all-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useServiceFormFields(serviceId: string | null) {
  return useQuery({
    queryKey: ["service-form-fields", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_form_fields")
        .select("*")
        .eq("service_id", serviceId!)
        .order("sort_order");
      if (error) throw error;
      return data as ServiceFormField[];
    },
    enabled: !!serviceId,
  });
}

export function useSpecialists() {
  return useQuery({
    queryKey: ["specialists"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "especialista");
      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (profError) throw profError;
      return profiles ?? [];
    },
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ["active-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
