import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, MoreHorizontal, Globe, Users, Palette, ArrowUpRight, Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CLINICAS = [
  { id: 1, name: "Clínica Estela Beauty", client: "Carla Mendonça", domain: "estelabeauty.bellex.app", users: 12, plan: "Pro", status: "ativo", color: "#e8957a", created: "15/03/2024" },
  { id: 2, name: "Studio Laser Gold", client: "Roberto Alves", domain: "studiolaser.bellex.app", users: 8, plan: "Starter", status: "ativo", color: "#f5c87a", created: "02/06/2024" },
  { id: 3, name: "Belle Skin Care", client: "Patrícia Souza", domain: "belleskin.bellex.app", users: 5, plan: "Enterprise", status: "ativo", color: "#a78bfa", created: "10/01/2024" },
  { id: 4, name: "Espaço Harmonia", client: "Marcos Vieira", domain: "harmonia.bellex.app", users: 4, plan: "Starter", status: "trial", color: "#60a5fa", created: "01/06/2025" },
  { id: 5, name: "Clínica Renová", client: "Ana Costa", domain: "renova.bellex.app", users: 3, plan: "Pro", status: "inadimplente", color: "#f87171", created: "18/08/2024" },
  { id: 6, name: "Glow Clínica", client: "Fernanda Lima", domain: "glowclinica.bellex.app", users: 7, plan: "Pro", status: "ativo", color: "#34d399", created: "05/04/2024" },
  { id: 7, name: "Studio Bella", client: "Fernanda Lima", domain: "studiobella.bellex.app", users: 4, plan: "Pro", status: "ativo", color: "#fb923c", created: "20/04/2024" },
];

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
};

export default function WorkspaceClinics() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = CLINICAS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Building2 className="w-5 h-5" />} title="Clínicas" subtitle="Todas as instalações ativas por cliente" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar clínica, cliente ou domínio..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => navigate("/workspace/clinicas/nova")} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova clínica
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl border border-border/40 bg-card overflow-hidden hover:shadow-md transition-shadow group">
            {/* Header colorido */}
            <div className="h-2" style={{ background: c.color }} />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: c.color }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.client}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><ArrowUpRight className="w-3.5 h-3.5 mr-2" />Acessar painel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/workspace/clinicas/${c.id}`)}>
                      <Settings className="w-3.5 h-3.5 mr-2" />Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/workspace/clinicas/${c.id}`)}>
                      <Globe className="w-3.5 h-3.5 mr-2" />Configurar domínio
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Suspender</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="w-3 h-3" />{c.domain}
                </p>
                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3 h-3" />{c.users} usuários
                </p>
                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Palette className="w-3 h-3" />{c.plan}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">Desde {c.created}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[c.status]}`}>
                  {c.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
