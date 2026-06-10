import { Key, Plus, AlertTriangle, CheckCircle2, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const LICENCAS = [
  { id: 1, client: "Patrícia Souza", plan: "Enterprise", seats: 10, used: 3, validUntil: "31/12/2025", status: "ativo", key: "LIC-ENT-2024-0031" },
  { id: 2, client: "Fernanda Lima", plan: "Pro", seats: 3, used: 2, validUntil: "15/06/2025", status: "expirando", key: "LIC-PRO-2024-0042" },
  { id: 3, client: "Carla Mendonça", plan: "Pro", seats: 3, used: 2, validUntil: "30/03/2026", status: "ativo", key: "LIC-PRO-2024-0058" },
  { id: 4, client: "Marcos Vieira", plan: "Starter", seats: 1, used: 1, validUntil: "30/06/2025", status: "trial", key: "LIC-STR-2025-0091" },
  { id: 5, client: "Ana Costa", plan: "Pro", seats: 3, used: 1, validUntil: "18/08/2025", status: "suspenso", key: "LIC-PRO-2024-0077" },
];

const statusIcon: Record<string, React.ReactNode> = {
  ativo: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  expirando: <Clock className="w-4 h-4 text-amber-500" />,
  trial: <Clock className="w-4 h-4 text-blue-500" />,
  suspenso: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusBadge: Record<string, string> = {
  ativo: "bg-green-50 text-green-700 border-green-200",
  expirando: "bg-amber-50 text-amber-700 border-amber-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
  suspenso: "bg-red-50 text-red-700 border-red-200",
};

export default function WorkspaceLicencas() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Key className="w-5 h-5" />} title="Licenças" subtitle="Gestão de licenças e seats por cliente" />

      {/* Alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">1 licença expirando em breve</p>
          <p className="text-xs text-amber-700 mt-0.5">Fernanda Lima — Pro · expira em 15/06/2025 (5 dias)</p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100">Renovar</Button>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova licença
        </Button>
      </div>

      {/* Cards de licença */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LICENCAS.map(l => (
          <div key={l.id} className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{l.client}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l.plan} · <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{l.key}</code></p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Renovar</DropdownMenuItem>
                  <DropdownMenuItem>Editar seats</DropdownMenuItem>
                  <DropdownMenuItem>Alterar validade</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Suspender</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Barra de seats */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Seats usados</span>
                <span className="font-medium">{l.used} / {l.seats}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(l.used / l.seats) * 100}%`, background: l.used === l.seats ? "#f87171" : "hsl(var(--primary))" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {statusIcon[l.status]}
                <span>Válida até {l.validUntil}</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[l.status]}`}>
                {l.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova licença</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carla">Carla Mendonça</SelectItem>
                  <SelectItem value="roberto">Roberto Alves</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select><SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Seats</Label>
                <Input type="number" placeholder="3" defaultValue={3} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Válida até</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => setOpen(false)}>Criar licença</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
