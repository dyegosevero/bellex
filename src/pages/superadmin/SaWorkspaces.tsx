import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSaWorkspaces } from "@/hooks/useSaWorkspaces";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useSaPlans } from "@/hooks/useSaPlans";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Users, Building2, MoreHorizontal, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  ativo: "#22c55e", trial: "#60a5fa", inadimplente: "#ef4444",
  suspenso: "#f59e0b", cancelado: "#64748b", expirando: "#f59e0b",
};

export default function SaWorkspaces() {
  const navigate = useNavigate();
  const { workspaces: licenses, loading, update } = useSaWorkspaces();
  const { clinics } = useWorkspaceClinics();
  const { plans: saPlans } = useSaPlans();
  const [search, setSearch] = useState("");

  const filtered = licenses.filter(l =>
    l.client_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const clinicsForWs = (id: string) => clinics.filter(c => c.customer_id === id).length;

  const handleSuspend  = async (id: string) => { const r = await update(id, { status: "suspenso" }); if (r.error) toast.error("Erro"); else toast.success("Suspenso"); };
  const handleActivate = async (id: string) => { const r = await update(id, { status: "ativo"    }); if (r.error) toast.error("Erro"); else toast.success("Reativado"); };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Workspaces</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Todos os workspaces ativos na plataforma</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/workspaces/novo")}>
          <Plus className="w-3.5 h-3.5" /> Novo workspace
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar workspace ou e-mail..."
          className="pl-9 h-8 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Users className="w-10 h-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">{search ? "Nenhum resultado." : "Nenhum workspace cadastrado."}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_80px_80px_70px_40px] px-4 py-2.5 border-b border-border/40 bg-muted/30">
            {["Workspace", "Plano", "Clínicas", "Status", "MRR", ""].map(h => (
              <span key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">{h}</span>
            ))}
          </div>
          {filtered.map(ws => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="grid grid-cols-[2fr_1fr_80px_80px_70px_40px] px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors items-center last:border-0 cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">{ws.client_name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ws.contact_email ?? "—"}</p>
              </div>
              <span className="text-[12px] text-muted-foreground capitalize">
                {saPlans.find(p => p.slug === ws.plan)?.name ?? ws.plan}
              </span>
              <span className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />{clinicsForWs(ws.id)}
              </span>
              <span className="text-[11px] font-semibold capitalize" style={{ color: statusColor[ws.status] ?? "#64748b" }}>
                {ws.status}
              </span>
              <span className="text-[12px] font-medium text-green-600">
                {ws.status === "ativo"
                  ? `R$ ${(saPlans.find(p => p.slug === ws.plan)?.price_monthly ?? 0).toLocaleString("pt-BR")}`
                  : "—"}
              </span>
              <div onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/workspaces/${ws.id}`)}>Editar</DropdownMenuItem>
                    {ws.status !== "suspenso"
                      ? <DropdownMenuItem className="text-amber-600" onClick={() => handleSuspend(ws.id)}>Suspender</DropdownMenuItem>
                      : <DropdownMenuItem className="text-green-600" onClick={() => handleActivate(ws.id)}>Reativar</DropdownMenuItem>
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
