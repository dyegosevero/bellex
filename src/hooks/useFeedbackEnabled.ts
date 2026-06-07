import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeedbackEnabled() {
  const { data } = useQuery({
    queryKey: ["clinic-feedback-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("feedback_enabled")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.feedback_enabled ?? true;
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? true;
}
