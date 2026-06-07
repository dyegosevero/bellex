import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PendingBilling {
  appointment_id: string;
  client_id: string;
  client_name: string | null;
  specialist_id: string | null;
  specialist_name: string | null;
  service_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

/**
 * Lists past appointments (status realizado/em_atendimento, end_time < now)
 * that don't yet have a charge linked. Used to drive the cobrança-obrigatória
 * banner/popup.
 *
 * - admin/atendimento: see all
 * - especialista: see only own
 */
export function usePendingBillings() {
  const { user, role } = useAuth();

  const query = useQuery({
    queryKey: ["pending-billings", role, user?.id],
    queryFn: async () => {
      const params = role === "especialista" && user?.id
        ? { p_specialist_id: user.id }
        : { p_specialist_id: null };
      const { data, error } = await supabase.rpc("pending_billings", params as any);
      if (error) throw error;
      return (data ?? []) as PendingBilling[];
    },
    enabled: !!user,
    refetchInterval: 60_000, // refresh every minute
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  return {
    items: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
