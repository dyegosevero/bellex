import { useWorkspaceLicenses } from "@/hooks/useWorkspaceLicenses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plug, Database, MessageSquare, Bot, Info, Loader2 } from "lucide-react";

const INTEGRATIONS = [
  { id: "supabase",  name: "Supabase",           icon: Database,       color: "#3ecf8e", description: "Banco de dados e autenticação — via anon key por subdomínio." },
  { id: "evolution", name: "EvolutionAPI",        icon: MessageSquare,  color: "#25d366", description: "WhatsApp por clínica — configurado em Clínicas › Configurações." },
  { id: "openai",    name: "OpenAI",              icon: Bot,            color: "#a78bfa", description: "API Key por clínica — configurado em Clínicas › Configurações." },
];

export default function SaIntegracoes() {
  const { licenses, loading } = useWorkspaceLicenses();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader icon={<Plug className="w-5 h-5" />} title="Integrações" subtitle="Visão geral das integrações ativas na plataforma" />

      {/* Info */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm text-white/70 font-medium">Chaves de API ficam no banco</p>
          <p className="text-xs text-white/40">
            As credenciais de cada clínica (OpenAI, EvolutionAPI, etc.) são salvas criptografadas no Supabase, vinculadas ao registro da clínica.
            Não há chaves salvas no browser.
          </p>
        </div>
      </div>

      {/* Integrações da plataforma */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Arquitetura de integrações</p>
        {INTEGRATIONS.map(integ => {
          const Icon = integ.icon;
          return (
            <div key={integ.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${integ.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: integ.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{integ.name}</p>
                <p className="text-xs text-white/40">{integ.description}</p>
              </div>
              <span className="text-[10px] font-semibold text-green-400 bg-green-950/50 border border-green-900/40 px-2 py-0.5 rounded-full">
                Ativo
              </span>
            </div>
          );
        })}
      </div>

      {/* Por workspace */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">
          Configuração por workspace ({licenses.length} {licenses.length === 1 ? "workspace" : "workspaces"})
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-white/30 py-8 text-center">Nenhum workspace cadastrado.</p>
        ) : (
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
              {["Workspace", "Plano", "Status"].map(h => (
                <span key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.07em]">{h}</span>
              ))}
            </div>
            {licenses.map(l => (
              <div key={l.id} className="grid grid-cols-[2fr_1fr_1fr] px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center last:border-0">
                <span className="text-sm font-medium truncate">{l.client_name}</span>
                <span className="text-xs text-white/50 capitalize">{l.plan}</span>
                <span className="text-xs capitalize" style={{
                  color: l.status === "ativo" ? "#22c55e" : l.status === "trial" ? "#60a5fa" : "#ef4444"
                }}>{l.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
