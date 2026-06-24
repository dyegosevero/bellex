import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WorkspaceUser = {
  id: string;
  workspace_owner_id: string;
  email: string;
  user_id: string | null;
  role: "admin" | "viewer";
  status: "pending" | "active" | "revoked";
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
};

export function useWorkspaceUsers() {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workspace_users")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data as WorkspaceUser[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const invite = async (email: string, role: "admin" | "viewer" = "admin") => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("invite-workspace-user", {
      body: { email, role },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) { toast.error(res.error.message); return false; }
    toast.success(`Convite enviado para ${email}`);
    await fetch();
    return true;
  };

  const revoke = async (id: string) => {
    const { error } = await supabase
      .from("workspace_users")
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) { toast.error("Erro ao revogar acesso"); return false; }
    toast.success("Acesso revogado");
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("workspace_users").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover usuário"); return false; }
    await fetch();
    return true;
  };

  return { users, loading, invite, revoke, remove, refetch: fetch };
}
