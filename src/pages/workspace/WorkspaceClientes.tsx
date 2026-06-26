import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, MoreHorizontal, Building2, ArrowUpRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { toast } from "sonner";

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  suspenso: "bg-orange-50 text-orange-700 border-orange-200",
  cancelado: "bg-muted text-muted-foreground border-border",
};

const planLabel: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

export default function WorkspaceClientes() {
  const navigate = useNavigate();
  const { licenses, loading, error, create, update } = useWorkspaceLicenses();
  const { clinics } = useWorkspaceClinics();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [plan, setPlan] = useState<string>("starter");

  const clinicsPerClient = (clientId: string) =>
    clinics.filter(c => c.customer_id === clientId).length;

  const filtered = licenses.filter(l =>
    l.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!clientName.trim()) { toast.error("Nome do cliente obrigatório"); return; }
    setSaving(true);
    try {
      const { error } = await create({
        client_name: clientName,
        plan,
        seats_total: 1,
        license_type: "anual",
        valid_until: null,
      });
      if (error) { toast.error(error); return; }
      toast.success("Cliente cadastrado com sucesso.");
      setOpen(false);
      setClientName(""); setPlan("starter");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Users className="w-5 h-5" />} title="Clientes" subtitle="Seus clientes do SaaS" />

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: licenses.length, color: "#e8957a" },
            { label: "Ativos", value: licenses.filter(l => l.status === "ativo").length, color: "#22c55e" },
            { label: "Trial", value: licenses.filter(l => l.status === "trial").length, color: "#3b82f6" },
            { label: "Inadimplentes", value: licenses.filter(l => l.status === "inadimplente").length, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/40 bg-card p-4">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando clientes…</span>
          </div>
        ) : error ? (
          <p className="text-center py-12 text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">{search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
            {!search && <Button size="sm" onClick={() => setOpen(true)} className="mt-2"><Plus className="w-4 h-4 mr-1.5" />Cadastrar primeiro cliente</Button>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Clínicas</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Desde</th>
                <th className="p-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {l.client_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <p className="text-sm font-medium">{l.client_name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium capitalize">{planLabel[l.plan] ?? l.plan}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />{clinicsPerClient(l.id)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusBadge[l.status] ?? statusBadge.cancelado}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clinicas?cliente=${l.id}`)}><ArrowUpRight className="w-3.5 h-3.5 mr-2" />Ver clínicas</DropdownMenuItem>
                        {l.status !== "suspenso" ? (
                          <DropdownMenuItem className="text-orange-600" onClick={() => update(l.id, { status: "suspenso" }).then(r => { if (!r.error) toast.success("Suspenso"); })}>Suspender</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600" onClick={() => update(l.id, { status: "ativo" }).then(r => { if (!r.error) toast.success("Reativado"); })}>Reativar</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do cliente *</Label>
              <Input placeholder="Ex: Patricia" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={v => setPlan(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}Cadastrar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
