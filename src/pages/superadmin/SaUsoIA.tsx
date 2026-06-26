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

const PLAN_LIMITS: Record<string, { storage_gb: number; ai_conversations_month: number }> = {
  starter: { storage_gb: 10,  ai_conversations_month: 250  },
  pro:     { storage_gb: 20,  ai_conversations_month: 600  },
  scale:   { storage_gb: 30,  ai_conversations_month: 1000 },
};

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.min(Math.round((used / total) * 100), 999);
}

function PctBar({ used, total, color }: { used: number; total: number; color: string }) {
  const p = pct(used, total);
  const barColor = p >= 90 ? "#ef4444" : p >= 75 ? "#f59e0b" : color;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-white/30">{used.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")}</span>
        <span style={{ color: p > 100 ? "#ef4444" : "#64748b" }}>{p}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p, 100)}%`, background: barColor }} />
      </div>
    </div>
  );
}

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
          <h1 className="text-lg font-semibold text-white/90">Uso & IA</h1>
          <p className="text-[12px] text-white/30 mt-0.5">
            Consumo de recursos por workspace — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button
          size="sm" variant="ghost"
          className="gap-1.5 text-white/30 hover:text-white hover:bg-white/10"
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
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-[0.07em]">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-white/30">
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
            const planKey = (r.plan ?? "starter").toLowerCase();
            const lim = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.starter;
            const convPct   = pct(r.conversations_month, lim.ai_conversations_month);
            const storePct  = pct(r.storage_bytes, lim.storage_gb * 1024 * 1024 * 1024);
            const hasAlert  = convPct >= 80 || storePct >= 80;

            return (
              <div
                key={r.workspace_id}
                className={`rounded-xl border bg-white/[0.02] p-5 ${hasAlert ? "border-amber-900/50" : "border-white/[0.07]"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-white/85">{r.client_name}</p>
                      {hasAlert && (
                        <span className="text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-900/50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Alerta
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5 capitalize">{r.plan}</p>
                  </div>
                  <span className="text-[11px] font-semibold capitalize" style={{ color: statusColor[r.status] ?? "#64748b" }}>
                    {r.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-2">
                      <MessageSquare className="w-3 h-3" /> Conversas IA / mês
                    </div>
                    <PctBar used={r.conversations_month} total={lim.ai_conversations_month} color="#a78bfa" />
                    <p className="text-[10px] text-white/20">limite do plano: {lim.ai_conversations_month} conv.</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-2">
                      <HardDrive className="w-3 h-3" /> Storage usado
                    </div>
                    <PctBar used={r.storage_bytes} total={lim.storage_gb * 1024 * 1024 * 1024} color="#60a5fa" />
                    <p className="text-[10px] text-white/20">{fmtBytes(r.storage_bytes)} de {lim.storage_gb} GB</p>
                  </div>
                </div>

                {r.tokens_month > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <p className="text-[10px] text-white/30">
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
