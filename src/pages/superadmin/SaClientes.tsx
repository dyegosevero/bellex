import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Search, MoreHorizontal, Plug, Building2, Key,
  CreditCard, Loader2, ArrowUpRight,
} from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  suspenso: "bg-orange-50 text-orange-700 border-orange-200",
  cancelado: "bg-muted text-muted-foreground border-border",
};

const PLAN_PRICE: Record<string, number> = { starter: 197, pro: 397, scale: 897 };
const PLAN_COLOR: Record<string, string> = { starter: "#60a5fa", pro: "#e8957a", scale: "#a78bfa" };

export default function SaClientes() {
  const navigate = useNavigate();
  const { licenses, loading } = useWorkspaceLicenses();
  const { clinics } = useWorkspaceClinics();
  const [search, setSearch] = useState("");

  const clinicsOf = (licId: string) => clinics.filter(c => c.license_id === licId).length;

  const filtered = licenses.filter(l =>
    l.client_name.toLowerCase().includes(search.toLowerCase()) ||
    l.license_key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Users className="w-5 h-5" />} title="Clientes" subtitle="Todos os tenants da plataforma" />

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: licenses.length, color: "#e8957a" },
            { label: "Ativos", value: licenses.filter(l => l.status === "ativo").length, color: "#22c55e" },
            { label: "Trial", value: licenses.filter(l => l.status === "trial").length, color: "#3b82f6" },
            { label: "MRR", value: `R$ ${licenses.filter(l => l.status === "ativo").reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 0), 0).toLocaleString("pt-BR")}`, color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/40 bg-card p-4">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar tenant…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum tenant encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Clínicas</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">MRR</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Integrações</th>
                <th className="p-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${i % 2 ? "bg-muted/10" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {l.client_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{l.client_name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" />{l.license_key}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${PLAN_COLOR[l.plan]}22`, color: PLAN_COLOR[l.plan] }}
                    >
                      {l.plan}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />{clinicsOf(l.id)}/{l.seats_total}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm font-medium text-green-600">
                      {l.status === "ativo" ? `R$ ${(PLAN_PRICE[l.plan] ?? 0).toLocaleString("pt-BR")}` : "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[l.status] ?? STATUS_STYLE.cancelado}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <button
                      onClick={() => navigate(`/superadmin/integracoes?tenant=${l.id}`)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Plug className="w-3 h-3" /> Configurar
                    </button>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/superadmin/integracoes?tenant=${l.id}`)}>
                          <Plug className="w-3.5 h-3.5 mr-2" />Integrações
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CreditCard className="w-3.5 h-3.5 mr-2" />Alterar plano
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowUpRight className="w-3.5 h-3.5 mr-2" />Ver clínicas
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Suspender tenant</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
