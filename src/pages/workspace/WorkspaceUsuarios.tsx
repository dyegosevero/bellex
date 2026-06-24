import { useState } from "react";
import { UserCog, Plus, Mail, MoreHorizontal, Clock, CheckCircle2, XCircle, Loader2, ShieldCheck, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspaceUsers } from "@/hooks/useWorkspaceUsers";
import { useAuth } from "@/contexts/AuthContext";

const statusIcon = {
  pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  active:  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  revoked: <XCircle className="w-3.5 h-3.5 text-muted-foreground" />,
};

const statusLabel = { pending: "Pendente", active: "Ativo", revoked: "Revogado" };

const roleIcon = {
  admin:  <ShieldCheck className="w-3.5 h-3.5 text-primary" />,
  viewer: <Eye className="w-3.5 h-3.5 text-muted-foreground" />,
};

export default function WorkspaceUsuarios() {
  const { user } = useAuth();
  const { users, loading, invite, revoke, remove } = useWorkspaceUsers();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("admin");
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) return;
    setSaving(true);
    const ok = await invite(email.trim(), role);
    if (ok) { setEmail(""); setRole("admin"); setOpen(false); }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader
          icon={<UserCog className="w-5 h-5" />}
          title="Usuários"
          subtitle="Admins com acesso ao painel do workspace"
        />
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Convidar
        </Button>
      </div>

      {/* Owner card */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proprietário</p>
        </div>
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Proprietário do workspace</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="w-3.5 h-3.5" /> Owner
          </div>
        </div>
      </div>

      {/* Invited users */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Usuários convidados {!loading && `(${users.length})`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <UserCog className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum usuário convidado ainda.</p>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Convidar primeiro admin
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {statusIcon[u.status]} {statusLabel[u.status]}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {roleIcon[u.role]} {u.role === "admin" ? "Admin" : "Visualizador"}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {u.status !== "revoked" ? (
                      <DropdownMenuItem className="text-orange-600" onClick={() => revoke(u.id)}>
                        Revogar acesso
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => invite(u.email, u.role)}>
                        Reenviar convite
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => remove(u.id)}>
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="email@exemplo.com"
                  className="pl-9"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Permissão</Label>
              <Select value={role} onValueChange={v => setRole(v as "admin" | "viewer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — acesso completo</SelectItem>
                  <SelectItem value="viewer">Visualizador — somente leitura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              O usuário receberá um e-mail com link de acesso ao workspace.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={saving || !email.includes("@")}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
