import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Settings, Users, Mail, Shield, CalendarDays, Plus, Edit, Bell, Plug, CalendarClock, Clock, Trash2, KeyRound, Eye, EyeOff, AlertTriangle, Ban, FileSignature } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BlurFade } from "@/components/ui/blur-fade";

import EmailTab from "@/components/admin/EmailTab";
import NotificationsTab from "@/components/admin/NotificationsTab";
import IntegrationsTab from "@/components/admin/IntegrationsTab";
import AgendaTab from "@/components/admin/AgendaTab";
import BusinessHoursTab from "@/components/admin/BusinessHoursTab";
import DocumentsTab from "@/components/admin/DocumentsTab";
import { fmtDate } from "@/lib/date";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  especialista: "Especialista",
  atendimento: "Recepcionista",
};

const Admin = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "agenda";
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wider">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de usuários e configurações do sistema</p>
        </div>
      </BlurFade>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="agenda" className="gap-2 normal-case"><CalendarClock className="w-4 h-4" /> Agenda</TabsTrigger>
          <TabsTrigger value="horarios" className="gap-2 normal-case"><Clock className="w-4 h-4" /> Horários</TabsTrigger>
          {/* Equipa movida para /equipe no sidebar */}
          {/* <TabsTrigger value="roles" className="gap-2 normal-case"><Shield className="w-4 h-4" /> Permissões</TabsTrigger> */}
          <TabsTrigger value="email" className="gap-2 normal-case"><Mail className="w-4 h-4" /> E-mail</TabsTrigger>
          
          <TabsTrigger value="notifications" className="gap-2 normal-case"><Bell className="w-4 h-4" /> Notificações</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 normal-case"><Plug className="w-4 h-4" /> Integrações</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 normal-case"><FileSignature className="w-4 h-4" /> Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" forceMount className="data-[state=inactive]:hidden"><AgendaTab /></TabsContent>
        <TabsContent value="horarios" forceMount className="data-[state=inactive]:hidden"><BusinessHoursTab /></TabsContent>
        {/* UsersTab movida para /equipe */}
        <TabsContent value="roles" forceMount className="data-[state=inactive]:hidden"><RolesInfoTab /></TabsContent>
        <TabsContent value="email" forceMount className="data-[state=inactive]:hidden"><EmailTab /></TabsContent>
        
        <TabsContent value="notifications" forceMount className="data-[state=inactive]:hidden"><NotificationsTab /></TabsContent>
        <TabsContent value="integrations" forceMount className="data-[state=inactive]:hidden"><IntegrationsTab /></TabsContent>
        <TabsContent value="documents" forceMount className="data-[state=inactive]:hidden"><DocumentsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

/* ═══════════════════════════════ USERS TAB ═══════════════════════════════ */

export const UsersTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<"delete" | "block" | null>(null);
  const [deleteUser, setDeleteUser] = useState<{ user_id: string; full_name: string } | null>(null);
  const [resetUser, setResetUser] = useState<{ user_id: string; full_name: string } | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resetting, setResetting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async ({ userId, mode }: { userId: string; mode: "delete" | "block" }) => {
      const { data, error } = await invokeEdgeFunction("delete-user", {
        body: { user_id: userId, mode },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.mode === "block" ? "Usuário bloqueado e arquivado" : "Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeletingId(null);
      setDeleteMode(null);
      setDeleteUser(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeletingId(null);
      setDeleteMode(null);
    },
  });

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, { data: emails, error: emailsError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, full_name, phone, created_at, blocked"),
        supabase.from("user_roles").select("id, user_id, role, created_at"),
        supabase.rpc("list_user_emails"),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (emailsError) throw emailsError;

      const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
      const emailMap = new Map((emails ?? []).map((entry: any) => [entry.user_id, entry.email]));

      return (roles ?? [])
        .map((userRole) => {
          const profile = profileMap.get(userRole.user_id);
          const fallbackEmail = emailMap.get(userRole.user_id);
          const fallbackName = typeof fallbackEmail === "string" ? fallbackEmail.split("@")[0] : "Sem nome";

          return {
            id: profile?.id ?? userRole.id,
            user_id: userRole.user_id,
            full_name: profile?.full_name?.trim() || fallbackName,
            phone: profile?.phone ?? null,
            created_at: profile?.created_at ?? userRole.created_at,
            blocked: profile?.blocked ?? false,
            email: fallbackEmail,
            role: (userRole.role ?? null) as string | null,
            role_id: userRole.id,
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {usersWithRoles?.length ?? 0} usuários cadastrados
      </p>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Colaboradores</span>
          </div>
          <Button onClick={() => navigate("/admin/usuarios/novo")} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>

        <div className="rounded-lg overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Nome</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">E-mail</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Telefone</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Perfil</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Cadastro</TableHead>
              <TableHead className="text-xs uppercase tracking-wider w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : usersWithRoles && usersWithRoles.length > 0 ? (
              usersWithRoles.map((u) => (
                <TableRow key={u.id} className={u.blocked ? "opacity-50" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/admin/usuarios/${u.user_id}`)} className="hover:underline hover:text-primary transition-colors text-left">
                        {u.full_name || "Sem nome"}
                      </button>
                      {u.blocked && (
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                          <Ban className="w-3 h-3 mr-1" /> Bloqueado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{(u.email as string) || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.phone || "—"}</TableCell>
                  <TableCell>
                    {u.role ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem perfil</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDate(u.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!u.blocked && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResetUser({ user_id: u.user_id, full_name: u.full_name })}>
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/usuarios/${u.user_id}/editar`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteUser({ user_id: u.user_id, full_name: u.full_name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </Card>

      {/* Delete/Block Modal */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) { setDeleteUser(null); setDeleteMode(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Remover Colaborador
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  O que deseja fazer com <strong>{deleteUser?.full_name}</strong>?
                </p>
                <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>Excluir e Deletar:</strong> Remove o usuário permanentemente, incluindo todos os agendamentos associados. Esta ação é irreversível.</p>
                  <p><strong>Bloquear e Manter:</strong> Revoga o acesso ao sistema (não consegue fazer login), mas mantém o histórico de agendamentos e dados para referência futura.</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)} className="sm:mr-auto">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteUser) return;
                setDeletingId(deleteUser.user_id);
                setDeleteMode("block");
                deleteMutation.mutate({ userId: deleteUser.user_id, mode: "block" });
              }}
              className="gap-2"
            >
              <Ban className="w-4 h-4" />
              {deleteMode === "block" && deleteMutation.isPending ? "Bloqueando..." : "Bloquear e Manter"}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteUser) return;
                setDeletingId(deleteUser.user_id);
                setDeleteMode("delete");
                deleteMutation.mutate({ userId: deleteUser.user_id, mode: "delete" });
              }}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMode === "delete" && deleteMutation.isPending ? "Excluindo..." : "Excluir e Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={!!resetUser} onOpenChange={(open) => { if (!open) { setResetUser(null); setNewPass(""); setConfirmPass(""); setShowPass(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para <strong>{resetUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input
                type={showPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
            {newPass && confirmPass && newPass !== confirmPass && (
              <p className="text-sm text-destructive">As senhas não coincidem.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetUser(null); setNewPass(""); setConfirmPass(""); setShowPass(false); }}>
              Cancelar
            </Button>
            <Button
              disabled={!newPass || newPass.length < 6 || newPass !== confirmPass || resetting}
              onClick={async () => {
                if (!resetUser) return;
                setResetting(true);
                try {
                  const { data, error } = await invokeEdgeFunction("admin-reset-password", {
                    body: { user_id: resetUser.user_id, new_password: newPass },
                  });
                  if (error) throw new Error(error.message);
                  if (data?.error) throw new Error(data.error);
                  toast.success("Senha redefinida com sucesso");
                  setResetUser(null); setNewPass(""); setConfirmPass(""); setShowPass(false);
                } catch (err: any) {
                  toast.error(err.message || "Erro ao redefinir senha");
                } finally {
                  setResetting(false);
                }
              }}
            >
              {resetting ? "Salvando..." : "Redefinir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ═══════════════════════════════ ROLES INFO TAB ═══════════════════════════════ */

const modules = [
  "Clientes",
  "Atendimentos",
  "Produtos",
  "Cobranças",
  "Ficha Clínica",
  "Usuários",
  "Configurações",
] as const;

const actions = ["Visualizar", "Criar", "Editar", "Remover"] as const;

type PermMap = Record<string, Record<string, boolean>>;

const adminPerms: PermMap = Object.fromEntries(
  modules.map((m) => [m, Object.fromEntries(actions.map((a) => [a, true]))])
);

const especialistaPerms: PermMap = {
  Clientes: { Visualizar: true, Criar: true, Editar: true, Remover: false },
  Atendimentos: { Visualizar: true, Criar: true, Editar: true, Remover: false },
  Produtos: { Visualizar: true, Criar: false, Editar: false, Remover: false },
  Cobranças: { Visualizar: true, Criar: false, Editar: false, Remover: false },
  "Ficha Clínica": { Visualizar: true, Criar: true, Editar: true, Remover: false },
  Usuários: { Visualizar: false, Criar: false, Editar: false, Remover: false },
  Configurações: { Visualizar: false, Criar: false, Editar: false, Remover: false },
};

const recepcionistaPerms: PermMap = {
  Clientes: { Visualizar: true, Criar: true, Editar: true, Remover: false },
  Atendimentos: { Visualizar: true, Criar: true, Editar: false, Remover: false },
  Produtos: { Visualizar: true, Criar: false, Editar: false, Remover: false },
  Cobranças: { Visualizar: true, Criar: true, Editar: true, Remover: false },
  "Ficha Clínica": { Visualizar: false, Criar: false, Editar: false, Remover: false },
  Usuários: { Visualizar: false, Criar: false, Editar: false, Remover: false },
  Configurações: { Visualizar: false, Criar: false, Editar: false, Remover: false },
};

const roles = [
  { name: "Administrador", perms: adminPerms, color: "text-primary" },
  { name: "Especialista", perms: especialistaPerms, color: "text-accent-foreground" },
  { name: "Recepcionista", perms: recepcionistaPerms, color: "text-muted-foreground" },
];

const RolesInfoTab = () => {
  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.name} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className={cn("text-sm font-semibold uppercase tracking-wider", role.color)}>
              {role.name}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium w-40">
                    Módulo
                  </th>
                  {actions.map((action) => (
                    <th
                      key={action}
                      className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium"
                    >
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, i) => (
                  <tr
                    key={mod}
                    className={cn(
                      "border-b border-border last:border-b-0",
                      i % 2 === 0 ? "" : "bg-muted/10"
                    )}
                  >
                    <td className="px-6 py-3 text-sm font-medium">{mod}</td>
                    {actions.map((action) => {
                      const checked = role.perms[mod]?.[action] ?? false;
                      return (
                        <td key={action} className="text-center px-4 py-3">
                          <Checkbox
                            checked={checked}
                            disabled
                            className="mx-auto data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
