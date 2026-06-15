import { CreditCard, Check, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";

const PLANOS_CONFIG = [
  {
    key: "starter" as const, name: "Starter", price: 197, seats: 1, color: "#60a5fa",
    features: ["1 clínica", "Até 3 especialistas", "Agenda online", "Cobranças básicas", "Suporte por e-mail"],
  },
  {
    key: "pro" as const, name: "Pro", price: 397, seats: 3, color: "#e8957a",
    features: ["Até 3 clínicas", "Especialistas ilimitados", "Agenda online", "Cobranças + Faturamento", "Pipeline de vendas", "Mensagens omnichannel", "Relatórios avançados", "Suporte prioritário"],
    popular: true,
  },
  {
    key: "scale" as const, name: "Scale", price: 897, seats: 10, color: "#a78bfa",
    features: ["Clínicas ilimitadas", "Especialistas ilimitados", "Tudo do Pro", "Domínio personalizado", "Branding completo", "API de integração", "SLA garantido", "Gerente de conta dedicado"],
  },
];

export default function WorkspacePlanos() {
  const [open, setOpen] = useState(false);
  const { licenses } = useWorkspaceLicenses();

  const activeByPlan = (key: string) => licenses.filter(l => l.plan === key && l.status === "ativo").length;
  const totalByPlan = (key: string) => licenses.filter(l => l.plan === key).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<CreditCard className="w-5 h-5" />} title="Planos" subtitle="Preços, features e configurações de cada plano" />

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo plano
        </Button>
      </div>

      {/* Cards de planos */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANOS_CONFIG.map(p => (
          <div key={p.key} className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">
            {p.popular && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-white text-[10px]">Mais popular</Badge>
              </div>
            )}
            <div className="h-1.5" style={{ background: p.color }} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-lg font-bold">{p.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">R$ {p.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Até {p.seats} {p.seats === 1 ? "clínica" : "clínicas"} · <strong>{activeByPlan(p.key)}</strong> ativos · {totalByPlan(p.key)} total
                </p>
              </div>

              <div className="space-y-2">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/40">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Features matrix */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-sm font-medium">Matriz de features</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Feature</th>
                {PLANOS_CONFIG.map(p => (
                  <th key={p.key} className="p-4 text-xs font-medium" style={{ color: p.color }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Agenda online", vals: [true, true, true] },
                { name: "Cobranças", vals: [true, true, true] },
                { name: "Faturamento", vals: [false, true, true] },
                { name: "Pipeline CRM", vals: [false, true, true] },
                { name: "Mensagens omnichannel", vals: [false, true, true] },
                { name: "Relatórios avançados", vals: [false, true, true] },
                { name: "API de integração", vals: [false, false, true] },
                { name: "Domínio personalizado", vals: [false, false, true] },
                { name: "SLA garantido", vals: [false, false, true] },
              ].map((row, i) => (
                <tr key={row.name} className={`border-b border-border/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                  <td className="p-4 text-sm">{row.name}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} className="p-4 text-center">
                      {v
                        ? <Check className="w-4 h-4 mx-auto" style={{ color: PLANOS_CONFIG[j].color }} />
                        : <span className="text-muted-foreground/30 text-lg">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo plano</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Ex: Business" /></div>
              <div className="space-y-1.5"><Label>Preço / mês (R$)</Label><Input type="number" placeholder="497" /></div>
            </div>
            <div className="space-y-1.5"><Label>Máx. clínicas (seats)</Label><Input type="number" placeholder="5" /></div>
            <div className="flex items-center justify-between py-1">
              <Label>Exibir como popular</Label>
              <Switch />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => setOpen(false)}>Criar plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
