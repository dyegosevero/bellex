import { UserCog, Search, MoreHorizontal, Shield, Mail, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Administrador", color: "#a78bfa", bg: "#f5f3ff" },
  especialista: { label: "Especialista", color: "#60a5fa", bg: "#eff6ff" },
  atendimento: { label: "Recepcionista", color: "#34d399", bg: "#f0fdf4" },
};

const USERS = [
  { id: 1, name: "Carla Mendonça", email: "carla@estelabeauty.com.br", role: "admin", clinic: "Clínica Estela Beauty", status: "ativo", lastAccess: "hoje" },
  { id: 2, name: "Julia Santos", email: "julia@estelabeauty.com.br", role: "especialista", clinic: "Clínica Estela Beauty", status: "ativo", lastAccess: "ontem" },
  { id: 3, name: "Beatriz Ramos", email: "beatriz@estelabeauty.com.br", role: "atendimento", clinic: "Clínica Estela Beauty", status: "ativo", lastAccess: "hoje" },
  { id: 4, name: "Roberto Alves", email: "roberto@studiolaser.com", role: "admin", clinic: "Studio Laser Gold", status: "ativo", lastAccess: "hoje" },
  { id: 5, name: "Marina Costa", email: "marina@studiolaser.com", role: "especialista", clinic: "Studio Laser Gold", status: "ativo", lastAccess: "3 dias atrás" },
  { id: 6, name: "Patrícia Souza", email: "patricia@belleskin.com.br", role: "admin", clinic: "Belle Skin Care", status: "ativo", lastAccess: "hoje" },
  { id: 7, name: "Amanda Lima", email: "amanda@belleskin.com.br", role: "especialista", clinic: "Belle Skin Care", status: "inativo", lastAccess: "15 dias atrás" },
  { id: 8, name: "Marcos Vieira", email: "marcos@harmonia.com", role: "admin", clinic: "Espaço Harmonia", status: "ativo", lastAccess: "hoje" },
];

const statusStyle: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  inativo: "bg-muted text-muted-foreground border-border",
};

export default function WorkspaceUsuarios() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("todos");

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.clinic.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "todos" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<UserCog className="w-5 h-5" />} title="Usuários das Clínicas" subtitle="Todos os usuários em todas as instalações" />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} className="rounded-xl border border-border/40 bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: r.bg }}>
              <Shield className="w-4 h-4" style={{ color: r.color }} />
            </div>
            <div>
              <p className="text-xl font-bold">{USERS.filter(u => u.role === key).length}</p>
              <p className="text-xs text-muted-foreground">{r.label}s</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar usuário ou clínica..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {["todos", "admin", "especialista", "atendimento"].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterRole === r ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
            >
              {r === "todos" ? "Todos" : ROLES[r]?.label ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Clínica</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Papel</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Último acesso</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="w-10 p-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={`border-b border-border/20 hover:bg-muted/10 transition-colors ${i % 2 ? "bg-muted/5" : ""}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                      {u.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />{u.clinic}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: ROLES[u.role]?.bg, color: ROLES[u.role]?.color }}
                  >
                    {ROLES[u.role]?.label}
                  </span>
                </td>
                <td className="p-4 hidden sm:table-cell text-xs text-muted-foreground">{u.lastAccess}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[u.status]}`}>{u.status}</span>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Alterar papel</DropdownMenuItem>
                      <DropdownMenuItem>Enviar reset de senha</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
