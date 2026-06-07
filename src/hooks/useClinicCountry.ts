import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { timezoneToCountry } from "@/components/ui/phone-input";

/** Returns ISO country code derived from the clinic's timezone setting. */
export function useClinicCountry(): string {
  const { data } = useQuery({
    queryKey: ["clinic-timezone"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("timezone")
        .maybeSingle();
      return data?.timezone ?? "Europe/Lisbon";
    },
    staleTime: 5 * 60 * 1000,
  });
  return timezoneToCountry(data ?? "Europe/Lisbon");
}
