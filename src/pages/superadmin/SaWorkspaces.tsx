import { useState } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
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
  const { licenses, loading, update } = useWorkspaceLicenses();
  const { clinics } = useWorkspaceClinics();
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
          <h1 className="text-lg font-semibold text-white/90">Workspaces</h1>
          <p className="text-[12px] text-white/30 mt-0.5">Todos os workspaces ativos na plataforma</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-white/10 hover:bg-white/15 text-white border-white/10 border">
          <Plus className="w-3.5 h-3.5" /> Novo workspace
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <Input
          placeholder="Buscar workspace ou e-mail..."
          className="pl-9 h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white/70 placeholder:text-white/20"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-white/30">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-white/20 gap-3">
          <Users className="w-10 h-10 opacity-20" />
          <p className="text-sm">{search ? "Nenhum resultado." : "Nenhum workspace cadastrado."}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_80px_80px_60px_40px] px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
            {["Workspace", "Plano", "Clínicas", "Status", "MRR", ""].map(h => (
              <span key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.07em]">{h}</span>
            ))}
          </div>
          {filtered.map(ws => (
            <div key={ws.id} className="grid grid-cols-[2fr_1fr_80px_80px_60px_40px] px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center">
              <div>
                <p className="text-[13px] text-white/80 font-medium">{ws.client_name}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{ws.contact_email ?? "—"}</p>
              </div>
              <span className="text-[12px] text-white/50 capitalize">{ws.plan}</span>
              <span className="text-[12px] text-white/50 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />{clinicsForWs(ws.id)}
              </span>
              <span className="text-[11px] font-semibold capitalize" style={{ color: statusColor[ws.status] ?? "#64748b" }}>
                {ws.status}
              </span>
              <span className="text-[12px] font-medium text-green-400">
                {ws.status === "ativo" ? `R$${ws.mrr ?? 0}` : "—"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-white/30 hover:text-white hover:bg-white/10">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d0d1a] border-white/10">
                  {ws.status !== "suspenso"
                    ? <DropdownMenuItem className="text-amber-400 focus:text-amber-300 focus:bg-amber-950/40" onClick={() => handleSuspend(ws.id)}>Suspender</DropdownMenuItem>
                    : <DropdownMenuItem className="text-green-400 focus:text-green-300 focus:bg-green-950/40" onClick={() => handleActivate(ws.id)}>Reativar</DropdownMenuItem>
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
