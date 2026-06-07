import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMonthRangeInTimezone } from "@/lib/date";

interface DashboardKPIs {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  total_revenue: number;
  monthly_revenue: number;
  monthly_appointments: number;
  avg_ticket: number;
  total_paid_charges: number;
}

interface LastVisit {
  client_id: string;
  client_name: string;
  specialist_id: string | null;
  last_visit: string | null;
  is_active: boolean;
}

interface InactiveClient {
  client_id: string;
  client_name: string;
  phone: string | null;
  email: string | null;
  last_visit: string | null;
  days_inactive: number | null;
  appointment_count: number;
}

interface RevenuePerSpecialist {
  specialist_id: string;
  specialist_name: string;
  total_revenue: number;
  appointment_count: number;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_kpis");
      if (error) throw error;
      return data as unknown as DashboardKPIs;
    },
    refetchInterval: 60_000,
  });
}

export function useLastVisits(limit = 10) {
  return useQuery({
    queryKey: ["last-visits", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("last_visits", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as LastVisit[];
    },
  });
}

export function useInactiveClients() {
  return useQuery({
    queryKey: ["inactive-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("inactive_clients");
      if (error) throw error;
      return (data ?? []) as unknown as InactiveClient[];
    },
  });
}

export function useInactivityDays() {
  return useQuery({
    queryKey: ["inactivity-days"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("inactivity_days")
        .limit(1)
        .single();
      return (data as any)?.inactivity_days ?? 90;
    },
    staleTime: 5 * 60_000,
  });
}

export function useRevenuePerSpecialist() {
  return useQuery({
    queryKey: ["revenue-per-specialist"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("revenue_per_specialist");
      if (error) throw error;
      return (data ?? []) as unknown as RevenuePerSpecialist[];
    },
  });
}

export interface MonthAppointment {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  client_name: string;
  specialist_name: string;
  service_name: string | null;
}

export function useMonthAppointments(month: Date) {
  const { start, end } = getMonthRangeInTimezone(month);

  return useQuery({
    queryKey: ["month-appointments", start],
    queryFn: async () => {
      const [apptRes, profilesRes] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            start_time,
            end_time,
            status,
            specialist_id,
            clients!inner(full_name),
            services(name)
          `)
          .gte("start_time", start)
          .lte("start_time", end)
          .order("start_time", { ascending: true }),
        supabase.from("profiles").select("user_id, full_name"),
      ]);

      if (apptRes.error) throw apptRes.error;

      const profileMap = new Map(
        (profilesRes.data ?? []).map((p: any) => [p.user_id, p.full_name])
      );

      return (apptRes.data ?? []).map((a: any) => ({
        id: a.id,
        start_time: a.start_time,
        end_time: a.end_time,
        status: a.status,
        client_name: a.clients?.full_name ?? "—",
        specialist_name: profileMap.get(a.specialist_id) || "Sem especialista",
        service_name: a.services?.name ?? null,
      })) as MonthAppointment[];
    },
  });
}
