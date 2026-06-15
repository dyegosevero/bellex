import { useState } from "react";
import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { HardDrive, AlertTriangle, ChevronRight, Save, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_LIMITS: Record<string, number> = { starter: 5, pro: 20, scale: 100 }; // GB
const STORAGE_KEY = "sa_storage_usage";

type StorageData = Record<string, { usedGb: string; customLimitGb: string }>;

function pct(used: number, limit: number) { return Math.min((used / limit) * 100, 100); }
function statusColor(p: number) {
  if (p >= 100) return { bar: "bg-red-500", text: "text-red-600", badge: "bg-red-50 text-red-700 border-red-200" };
  if (p >= 80) return { bar: "bg-orange-400", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200" };
  return { bar: "bg-primary", text: "text-primary", badge: "bg-green-50 text-green-700 border-green-200" };
}

export default function SaStorage() {
  const { licenses, loading } = useWorkspaceLicenses();
  const [storage, setStorage] = useState<StorageData>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const getLimitGb = (licId: string, plan: string) => {
    const custom = parseFloat(storage[licId]?.customLimitGb ?? "") || 0;
    return custom > 0 ? custom : (PLAN_LIMITS[plan] ?? 5);
  };

  const getUsedGb = (licId: string) => parseFloat(storage[licId]?.usedGb ?? "") || 0;

  const handleSave = (licId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      toast({ title: "Dados de storage salvos." });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  const alerts = licenses.filter(l => {
    const used = getUsedGb(l.id);
    const limit = getLimitGb(l.id, l.plan);
    return pct(used, limit) >= 80;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader icon={<HardDrive className="w-5 h-5" />} title="Storage por Tenant" subtitle="Uso de Cloudflare R2 — inserção manual por enquanto" />

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {alerts.length} tenant{alerts.length > 1 ? "s" : ""} com uso de storage ≥ 80%
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              {alerts.map(l => l.client_name).join(" · ")}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/30 bg-blue-50/50 p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Insira o uso manualmente por enquanto. Em breve a API Cloudflare R2 será consultada automaticamente via SA-11.
          Os limites padrão são: Starter 5 GB · Pro 20 GB · Scale 100 GB.
        </p>
      </div>

      {/* Storage list */}
      <div className="space-y-3">
        {licenses.map(l => {
          const usedGb = getUsedGb(l.id);
          const limitGb = getLimitGb(l.id, l.plan);
          const p = pct(usedGb, limitGb);
          const { bar, text, badge } = statusColor(p);
          const isExpanded = expanded === l.id;

          return (
            <div key={l.id} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              {/* Row */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : l.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {l.client_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{l.client_name}</p>
                    <span className="text-[10px] font-medium text-muted-foreground capitalize">{l.plan}</span>
                    {p >= 100 && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge}`}>Cheio</Badge>}
                    {p >= 80 && p < 100 && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge}`}>Alerta</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${p}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${text} whitespace-nowrap`}>
                      {usedGb.toFixed(1)} / {limitGb} GB ({p.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
              </button>

              {/* Expanded fields */}
              {isExpanded && (
                <div className="border-t border-border/20 p-4 space-y-4 bg-muted/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Uso atual (GB)</Label>
                      <Input
                        placeholder="Ex: 3.4"
                        value={storage[l.id]?.usedGb ?? ""}
                        onChange={e => setStorage(prev => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] ?? { usedGb: "", customLimitGb: "" }), usedGb: e.target.value },
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Limite customizado (GB) <span className="text-muted-foreground font-normal">— deixe vazio para usar o padrão do plano</span></Label>
                      <Input
                        placeholder={`Padrão: ${PLAN_LIMITS[l.plan] ?? 5} GB`}
                        value={storage[l.id]?.customLimitGb ?? ""}
                        onChange={e => setStorage(prev => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] ?? { usedGb: "", customLimitGb: "" }), customLimitGb: e.target.value },
                        }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleSave(l.id)} className="gap-1.5 text-xs">
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {licenses.length === 0 && (
          <div className="text-center py-16">
            <HardDrive className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum tenant encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
