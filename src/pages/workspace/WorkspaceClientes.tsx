import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, MoreHorizontal, Building2, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import { toast } from "sonner";

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  suspenso: "bg-orange-50 text-orange-700 border-orange-200",
  cancelado: "bg-muted text-muted-foreground border-border",
};

export default function WorkspaceClientes() {
  const navigate = useNavigate();
  const { workspace } = useCurrentWorkspace();
  const { clinics, loading, update } = useWorkspaceClinics();
  const [search, setSearch] = useState("");

  // Filtra apenas clínicas deste workspace
  const myClinicas = clinics.filter(c => c.customer_id === workspace?.id);

  const filtered = myClinicas.filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async (id: string) => {
    const { error } = await update(id, { status: "suspenso" });
    if (error) toast.error("Erro ao suspender"); else toast.success("Suspenso");
  };
  const handleReactivate = async (id: string) => {
    const { error } = await update(id, { status: "ativo" });
    if (error) toast.error("Erro ao reativar"); else toast.success("Reativado");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Users className="w-5 h-5" />} title="Clientes" subtitle="Gestão de clientes e licenças" />

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",        value: myClinicas.length,                                          color: "#e8957a" },
            { label: "Ativos",       value: myClinicas.filter(c => c.status === "ativo").length,        color: "#22c55e" },
            { label: "Trial",        value: myClinicas.filter(c => c.status === "trial").length,        color: "#3b82f6" },
            { label: "Inadimplentes",value: myClinicas.filter(c => c.status === "inadimplente").length, color: "#ef4444" },
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
        <Button size="sm" onClick={() => navigate("/clinicas/nova")} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando clientes…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
            </p>
            {!search && (
              <Button size="sm" onClick={() => navigate("/clinicas/nova")} className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" /> Cadastrar primeiro cliente
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Domínio</th>
                <th className="p-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="p-4">
                    <button onClick={() => navigate(`/clinicas/${c.id}`)} className="flex items-center gap-3 hover:opacity-75 transition-opacity text-left">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {(c.client_name || c.name).split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <p className="text-sm font-medium underline-offset-2 hover:underline">{c.client_name || "—"}</p>
                    </button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => navigate(`/clinicas/${c.id}`)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-2">
                      <Building2 className="w-3.5 h-3.5" />{c.name}
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">{c.plan}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusBadge[c.status] ?? statusBadge.cancelado}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <a
                      href={`https://${c.custom_domain || `${c.subdomain}.bellex.beauty`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      onClick={e => e.stopPropagation()}
                    >
                      {c.custom_domain || `${c.subdomain}.bellex.beauty`}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clinicas/${c.id}`)}>Ver detalhes</DropdownMenuItem>
                        {c.status !== "suspenso"
                          ? <DropdownMenuItem className="text-orange-600" onClick={() => handleSuspend(c.id)}>Suspender</DropdownMenuItem>
                          : <DropdownMenuItem className="text-green-600" onClick={() => handleReactivate(c.id)}>Reativar</DropdownMenuItem>
                        }
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
