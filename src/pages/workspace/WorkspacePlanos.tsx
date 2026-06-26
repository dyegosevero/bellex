import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Check, Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspacePlans, type WorkspacePlan } from "@/hooks/useWorkspacePlans";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";

export default function WorkspacePlanos() {
  const navigate = useNavigate();
  const { workspace } = useCurrentWorkspace();
  const { plans, loading, remove } = useWorkspacePlans(workspace?.id ?? undefined);
  const { licenses } = useWorkspaceLicenses();

  const [deleteTarget, setDeleteTarget] = useState<WorkspacePlan | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const activeByPlan = (name: string) =>
    licenses.filter(l => l.plan === name.toLowerCase() && l.status === "ativo").length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteText("");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={<CreditCard className="w-5 h-5" />}
        title="Planos"
        subtitle="Configure os planos que suas clínicas podem contratar"
      />

      <div className="flex justify-end">
        <Button size="sm" onClick={() => navigate("/planos/novo")} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo plano
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando planos...
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum plano cadastrado.</p>
          <Button size="sm" className="mt-3" onClick={() => navigate("/planos/novo")}>
            <Plus className="w-4 h-4 mr-1.5" /> Criar primeiro plano
          </Button>
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.id} className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">
              {p.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white text-[10px]">Mais popular</Badge>
                </div>
              )}
              {!p.active && (
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativo</Badge>
                </div>
              )}
              <div className="h-1.5" style={{ background: p.color }} />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-lg font-bold">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">
                      R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <span className="text-xs text-muted-foreground">🏥 {p.seats_limit} {p.seats_limit === 1 ? "clínica" : "clínicas"}</span>
                    <span className="text-xs text-muted-foreground">🤖 {p.ai_conversations_month} conv. IA/mês</span>
                    <span className="text-xs text-muted-foreground">💾 {p.storage_gb} GB</span>
                    <span className="text-xs text-muted-foreground"><strong>{activeByPlan(p.name)}</strong> ativo{activeByPlan(p.name) !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {p.features.length > 0 && (
                  <div className="space-y-2">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline" size="sm" className="flex-1 gap-1.5"
                    onClick={() => navigate(`/planos/${p.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { setDeleteTarget(p); setDeleteText(""); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setDeleteText(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Remover plano</DialogTitle>
            </div>
            <DialogDescription>
              Esta ação é irreversível. Clínicas no plano <strong>{deleteTarget?.name}</strong> não serão afetadas, mas novos contratos não poderão usar este plano.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <p className="text-xs text-muted-foreground">Digite <span className="font-mono font-semibold text-foreground">REMOVER</span> para confirmar</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="REMOVER" className="font-mono" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteText(""); }} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting || deleteText !== "REMOVER"}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {deleting ? "Removendo..." : "Remover definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
