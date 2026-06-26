import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Loader2, TrendingUp, Users, Building2, Zap,
  HardDrive, MessageSquare, AlertTriangle, ExternalLink,
} from "lucide-react";

type WorkspaceUsageRow = {
  workspace_id: string;
  client_name: string;
  plan: string;
  status: string;
  owner_id: string;
  conversations_month: number;
  tokens_month: number;
  storage_bytes: number;
};

const PLAN_LIMITS: Record<string, { storage_gb: number; ai_conversations_month: number; price: number }> = {
  starter: { storage_gb: 10,  ai_conversations_month: 250,  price: 500  },
  pro:     { storage_gb: 20,  ai_conversations_month: 600,  price: 750  },
  scale:   { storage_gb: 30,  ai_conversations_month: 1000, price: 1000 },
};

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan ?? "starter").toLowerCase()] ?? PLAN_LIMITS.starter;
}

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.min(Math.round((used / total) * 100), 999);
}

function PctBar({ value }: { value: number }) {
  const color = value >= 90 ? "#ef4444" : value >= 75 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
      <span className="text-[10px] w-10 text-right tabular-nums"
        style={{ color: value > 100 ? "#ef4444" : "#475569" }}>
        {value > 100 ? `${value}%!` : `${value}%`}
      </span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-[11px] text-white/40 uppercase tracking-[0.07em] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>
    </div>
  );
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}


const statusColor: Record<string, string> = {
  ativo: "#22c55e", trial: "#60a5fa", inadimplente: "#ef4444",
  suspenso: "#f59e0b", cancelado: "#64748b", expirando: "#f59e0b",
};

export default function SaDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<WorkspaceUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicCount, setClinicCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [usageRes, clinicRes] = await Promise.all([
        supabase.from("workspace_usage_summary").select("*"),
        supabase.from("workspace_clinics").select("id", { count: "exact", head: true }),
      ]);
      if (usageRes.data) setRows(usageRes.data as WorkspaceUsageRow[]);
      if (clinicRes.count != null) setClinicCount(clinicRes.count);
      setLoading(false);
    }
    load();
  }, []);

  const active = rows.filter(r => r.status === "ativo" || r.status === "trial");
  const mrr = rows.filter(r => r.status === "ativo")
    .reduce((sum, r) => sum + getPlanLimits(r.plan).price, 0);
  const totalConvs = rows.reduce((s, r) => s + r.conversations_month, 0);

  const alerts = rows.filter(r => {
    const lim = getPlanLimits(r.plan);
    return (
      pct(r.conversations_month, lim.ai_conversations_month) >= 80 ||
      pct(r.storage_bytes, lim.storage_gb * 1024 * 1024 * 1024) >= 80
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-white/30">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Carregando métricas...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="mb-1">
        <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
        <p className="text-[12px] text-white/30 mt-0.5">
          Visão geral da plataforma — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              {alerts.length} workspace{alerts.length > 1 ? "s" : ""} com uso elevado (≥80%)
            </p>
            <p className="text-[11px] text-amber-500/60 mt-0.5">{alerts.map(r => r.client_name).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={TrendingUp} label="MRR"
          value={mrr > 0 ? `R$ ${mrr.toLocaleString("pt-BR")}` : "R$ 0"}
          sub="workspaces ativos" color="#22c55e"
        />
        <KpiCard
          icon={Users} label="Workspaces ativos"
          value={String(active.length)}
          sub={`${rows.length} total`} color="#60a5fa"
        />
        <KpiCard
          icon={Building2} label="Clínicas"
          value={String(clinicCount)}
          sub="em todos os workspaces" color="#a78bfa"
        />
        <KpiCard
          icon={Zap} label="Conv. IA este mês"
          value={totalConvs.toLocaleString("pt-BR")}
          sub="total acumulado" color="#f59e0b"
        />
      </div>

      {/* Workspaces table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.08em]">
            Uso por workspace — {new Date().toLocaleDateString("pt-BR", { month: "long" })}
          </p>
          <button
            onClick={() => navigate("/workspaces")}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
          >
            Gerenciar <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_120px_120px_80px_70px] px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
            {["Workspace", "Plano", "Storage", "Conv. IA", "MRR", "Status"].map(h => (
              <span key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.07em]">{h}</span>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/20">Nenhum workspace cadastrado</p>
            </div>
          ) : (
            rows.map(r => {
              const lim = getPlanLimits(r.plan);
              const storagePct = pct(r.storage_bytes, lim.storage_gb * 1024 * 1024 * 1024);
              const aiPct = pct(r.conversations_month, lim.ai_conversations_month);
              return (
                <div
                  key={r.workspace_id}
                  className="grid grid-cols-[2fr_1fr_120px_120px_80px_70px] px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer items-center"
                  onClick={() => navigate("/workspaces")}
                >
                  <div>
                    <p className="text-[13px] text-white/80 font-medium">{r.client_name}</p>
                    <p className="text-[10px] text-white/20 mt-0.5 capitalize">{r.plan}</p>
                  </div>
                  <span className="text-[12px] text-white/50 capitalize">{r.plan}</span>
                  <div className="pr-4">
                    <p className="text-[10px] text-white/30 mb-1">{fmtBytes(r.storage_bytes)} / {lim.storage_gb} GB</p>
                    <PctBar value={storagePct} />
                  </div>
                  <div className="pr-4">
                    <p className="text-[10px] text-white/30 mb-1">{r.conversations_month} / {lim.ai_conversations_month}</p>
                    <PctBar value={aiPct} />
                  </div>
                  <span className="text-[12px] font-medium text-green-400">
                    {r.status === "ativo" ? `R$${lim.price.toLocaleString("pt-BR")}` : "—"}
                  </span>
                  <span className="text-[10px] font-semibold capitalize" style={{ color: statusColor[r.status] ?? "#64748b" }}>
                    {r.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Storage + Conv IA painéis */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-3.5 h-3.5 text-white/30" />
            <p className="text-[12px] font-semibold text-white/50">Storage por workspace</p>
          </div>
          {rows.length === 0 ? (
            <p className="text-[11px] text-white/20">Sem workspaces</p>
          ) : (
            <div className="space-y-3">
              {rows.map(r => {
                const lim = getPlanLimits(r.plan);
                return (
                  <div key={r.workspace_id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50 truncate">{r.client_name}</span>
                      <span className="text-[10px] text-white/25 ml-2 shrink-0">
                        {fmtBytes(r.storage_bytes)} / {lim.storage_gb} GB
                      </span>
                    </div>
                    <PctBar value={pct(r.storage_bytes, lim.storage_gb * 1024 * 1024 * 1024)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-white/30" />
            <p className="text-[12px] font-semibold text-white/50">Conv. IA este mês</p>
          </div>
          {rows.length === 0 ? (
            <p className="text-[11px] text-white/20">Sem workspaces</p>
          ) : (
            <div className="space-y-3">
              {rows.map(r => {
                const lim = getPlanLimits(r.plan);
                return (
                  <div key={r.workspace_id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50 truncate">{r.client_name}</span>
                      <span className="text-[10px] text-white/25 ml-2 shrink-0">
                        {r.conversations_month} / {lim.ai_conversations_month}
                      </span>
                    </div>
                    <PctBar value={pct(r.conversations_month, lim.ai_conversations_month)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
