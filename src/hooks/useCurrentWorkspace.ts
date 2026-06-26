import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentWorkspace = {
  id: string;
  client_name: string;
  plan: string;
  seats_total: number;
  seats_used: number;
  status: string;
};

export function useCurrentWorkspace() {
  const [workspace, setWorkspace] = useState<CurrentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from("workspace_customers")
        .select("id, client_name, plan, seats_total, seats_used, status")
        .eq("owner_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setWorkspace(data as CurrentWorkspace ?? null);
          setLoading(false);
        });
    });
  }, []);

  return { workspace, loading };
}
