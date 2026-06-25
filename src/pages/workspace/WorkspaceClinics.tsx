import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, MoreHorizontal, Globe, Palette, ArrowUpRight, Settings, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  suspenso: "bg-orange-50 text-orange-700 border-orange-200",
  cancelado: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function WorkspaceClinics() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { clinics, loading, update, remove } = useWorkspaceClinics();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async (id: string) => {
    const { error } = await update(id, { status: "suspenso" });
    if (error) toast.error("Erro ao suspender clínica");
    else toast.success("Clínica suspensa");
  };

  const handleActivate = async (id: string) => {
    const { error } = await update(id, { status: "ativo" });
    if (error) toast.error("Erro ao ativar clínica");
    else toast.success("Clínica ativada");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await remove(deleteTarget.id);
    setDeleting(false);
    if (error) toast.error("Erro ao remover clínica");
    else { toast.success("Clínica removida"); setDeleteTarget(null); }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Building2 className="w-5 h-5" />} title="Clínicas" subtitle="Todas as instalações ativas por cliente" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar clínica, cliente ou domínio..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => navigate("/clinicas/nova")} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova clínica
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando clínicas...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <Building2 className="w-10 h-10 opacity-20" />
          <p className="text-sm">{search ? "Nenhuma clínica encontrada." : "Nenhuma clínica cadastrada ainda."}</p>
          {!search && (
            <Button size="sm" variant="outline" onClick={() => navigate("/clinicas/nova")}>
              <Plus className="w-4 h-4 mr-1.5" /> Criar primeira clínica
            </Button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="rounded-2xl border border-border/40 bg-card overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => navigate(`/clinicas/${c.id}`)}
            >
              <div className="h-2" style={{ background: c.color }} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: c.color }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.client_name}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onSelect={() => window.open(`https://${c.subdomain}.bellex.beauty`, "_blank")}>
                        <ArrowUpRight className="w-3.5 h-3.5 mr-2" />Acessar painel
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/clinicas/${c.id}`)}>
                        <Settings className="w-3.5 h-3.5 mr-2" />Configurações
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/clinicas/${c.id}?tab=dominio`)}>
                        <Globe className="w-3.5 h-3.5 mr-2" />Configurar domínio
                      </DropdownMenuItem>
                      {c.status !== "suspenso" ? (
                        <DropdownMenuItem className="text-orange-600" onSelect={() => handleSuspend(c.id)}>
                          Suspender
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-green-600" onSelect={() => handleActivate(c.id)}>
                          Reativar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="w-3 h-3" />{c.custom_domain ?? `${c.subdomain}.bellex.beauty`}
                  </p>
                  <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <Palette className="w-3 h-3" />{c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Desde {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de remoção */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Remover clínica</DialogTitle>
            </div>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação é irreversível e todos os dados da clínica serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {deleting ? "Removendo..." : "Sim, remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
