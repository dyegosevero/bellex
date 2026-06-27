import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Zap, HardDrive, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UsageRow = {
  workspace_id: string;
  client_name: string;
  plan: string;
  status: string;
  conversations_month: number;
  tokens_month: number;
  storage_bytes: number;
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const statusColor: Record<string, string> = {
  ativo: "#22c55e", trial: "#60a5fa", inadimplente: "#ef4444",
  suspenso: "#f59e0b", cancelado: "#64748b",
};

export default function SaUsoIA() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("workspace_usage_summary").select("*");
    if (error) toast.error("Erro ao carregar métricas");
    else setRows((data as UsageRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalConvs = rows.reduce((s, r) => s + r.conversations_month, 0);
  const totalTokens = rows.reduce((s, r) => s + r.tokens_month, 0);
  const totalStorage = rows.reduce((s, r) => s + r.storage_bytes, 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Uso & IA</h1>
          <p className="text-[12px] text-muted-foreground/70 mt-0.5">
            Consumo de recursos por workspace — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button
          size="sm" variant="ghost"
          className="gap-1.5 text-muted-foreground/70 hover:text-white hover:bg-muted"
          onClick={() => load()}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MessageSquare, label: "Conv. IA este mês", value: totalConvs.toLocaleString("pt-BR"), color: "#a78bfa" },
          { icon: Zap,           label: "Tokens consumidos", value: totalTokens > 0 ? totalTokens.toLocaleString("pt-BR") : "—", color: "#f59e0b" },
          { icon: HardDrive,     label: "Storage total",     value: fmtBytes(totalStorage), color: "#60a5fa" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border/35 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-[0.07em]">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground/70">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <Zap className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Nenhum workspace cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            return (
              <div
                key={r.workspace_id}
                className="rounded-xl border bg-muted/20 p-5 border-border/35"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[14px] font-semibold text-white/85">{r.client_name}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 capitalize">{r.plan}</p>
                  </div>
                  <span className="text-[11px] font-semibold capitalize" style={{ color: statusColor[r.status] ?? "#64748b" }}>
                    {r.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                      <MessageSquare className="w-3 h-3" /> Conversas IA / mês
                    </div>
                    <p className="text-xl font-bold text-white/80">{r.conversations_month.toLocaleString("pt-BR")}</p>
                    <p className="text-[10px] text-muted-foreground/50">conversas este mês</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                      <HardDrive className="w-3 h-3" /> Storage usado
                    </div>
                    <p className="text-xl font-bold text-white/80">{fmtBytes(r.storage_bytes)}</p>
                    <p className="text-[10px] text-muted-foreground/50">armazenamento utilizado</p>
                  </div>
                </div>

                {r.tokens_month > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/25">
                    <p className="text-[10px] text-muted-foreground/70">
                      <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                      {r.tokens_month.toLocaleString("pt-BR")} tokens OpenAI consumidos este mês
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
