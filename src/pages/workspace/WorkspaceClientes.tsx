import { useState } from "react";
import { Users, Plus, Search, MoreHorizontal, Building2, Mail, Phone, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const CLIENTES = [
  { id: 1, name: "Carla Mendonça", email: "carla@estelabeauty.com.br", phone: "(11) 99123-4567", clinicas: 2, status: "ativo", plano: "Pro", desde: "Mar 2024" },
  { id: 2, name: "Roberto Alves", email: "roberto@studiolaser.com", phone: "(21) 98765-4321", clinicas: 1, status: "ativo", plano: "Starter", desde: "Jun 2024" },
  { id: 3, name: "Patrícia Souza", email: "patricia@belleskin.com.br", phone: "(31) 97654-3210", clinicas: 3, status: "ativo", plano: "Enterprise", desde: "Jan 2024" },
  { id: 4, name: "Marcos Vieira", email: "marcos@harmonia.com", phone: "(41) 96543-2109", clinicas: 1, status: "trial", plano: "Starter", desde: "Jun 2025" },
  { id: 5, name: "Ana Costa", email: "ana@renova.com.br", phone: "(51) 95432-1098", clinicas: 1, status: "inadimplente", plano: "Pro", desde: "Ago 2024" },
  { id: 6, name: "Fernanda Lima", email: "fernanda@glowclinica.com", phone: "(11) 94321-0987", clinicas: 2, status: "ativo", plano: "Pro", desde: "Abr 2024" },
];

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  inadimplente: "bg-red-50 text-red-700 border-red-200",
  cancelado: "bg-muted text-muted-foreground border-border",
};

export default function WorkspaceClientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = CLIENTES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Users className="w-5 h-5" />} title="Clientes" subtitle="Parceiros e titulares de licença" />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Clínicas</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Desde</th>
              <th className="p-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="space-y-0.5">
                    <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</p>
                    <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">{c.plano}</span>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />{c.clinicas}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{c.desde}</td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><ArrowUpRight className="w-3.5 h-3.5 mr-2" />Ver clínicas</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Alterar plano</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal novo cliente */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input placeholder="Nome da empresa" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>Plano inicial</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Starter</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => setOpen(false)}>Criar cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
