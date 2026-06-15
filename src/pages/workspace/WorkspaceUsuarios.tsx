import { UserCog, Building2, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useWorkspaceClinics } from "@/hooks/useWorkspaceClinics";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { useMemo } from "react";

const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Administrador", color: "#a78bfa", bg: "#f5f3ff" },
  especialista: { label: "Especialista", color: "#60a5fa", bg: "#eff6ff" },
  atendimento: { label: "Recepcionista", color: "#34d399", bg: "#f0fdf4" },
};

export default function WorkspaceUsuarios() {
  const { clinics, loading: loadingClin } = useWorkspaceClinics();
  const { licenses, loading: loadingLic } = useWorkspaceClinics();
  const loading = loadingClin || loadingLic;

  // Each clinic = 1 admin user (the license owner). Real per-clinic users
  // will come from the clinic_users table (backlog F-01).
  const rows = useMemo(() => clinics.map(c => ({
    id: c.id,
    clinic: c.name,
    role: "admin" as const,
    status: c.status,
    subdomain: c.subdomain,
    since: c.created_at,
  })), [clinics]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<UserCog className="w-5 h-5" />} title="Usuários" subtitle="Administradores e equipe por clínica" />

      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Gestão de equipe por clínica</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Atualmente exibe o administrador de cada clínica. O cadastro completo de especialistas e recepcionistas
            por clínica estará disponível no sprint F-01 (Fichas — Infraestrutura).
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{clinics.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Clínicas</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold">{clinics.filter(c => c.status === "ativo").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Admins ativos</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{clinics.filter(c => c.status === "trial").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Em trial</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <UserCog className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada ainda.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Subdomínio</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Papel</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Desde</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const role = ROLES[r.role];
                return (
                  <tr key={r.id} className={`border-b border-border/30 hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{r.clinic}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{r.subdomain}.bellex.app</td>
                    <td className="p-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: role.color, background: role.bg }}>
                        {role.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        r.status === "ativo" ? "bg-green-50 text-green-700 border-green-200"
                        : r.status === "trial" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-muted text-muted-foreground border-border"
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(r.since).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
