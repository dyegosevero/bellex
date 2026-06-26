import { useSaWorkspaces } from "@/hooks/useSaWorkspaces";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plug, Database, MessageSquare, Bot, Info, Loader2 } from "lucide-react";

const INTEGRATIONS = [
  { id: "supabase",  name: "Supabase",           icon: Database,       color: "#3ecf8e", description: "Banco de dados e autenticação — via anon key por subdomínio." },
  { id: "evolution", name: "EvolutionAPI",        icon: MessageSquare,  color: "#25d366", description: "WhatsApp por clínica — configurado em Clínicas › Configurações." },
  { id: "openai",    name: "OpenAI",              icon: Bot,            color: "#a78bfa", description: "API Key por clínica — configurado em Clínicas › Configurações." },
];

export default function SaIntegracoes() {
  const { workspaces: licenses, loading } = useSaWorkspaces();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Plug className="w-5 h-5" />} title="Integrações" subtitle="Visão geral das integrações ativas na plataforma" />

      {/* Info */}
      <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm text-foreground/80 font-medium">Chaves de API ficam no banco</p>
          <p className="text-xs text-muted-foreground">
            As credenciais de cada clínica (OpenAI, EvolutionAPI, etc.) são salvas criptografadas no Supabase, vinculadas ao registro da clínica.
            Não há chaves salvas no browser.
          </p>
        </div>
      </div>

      {/* Integrações da plataforma */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Arquitetura de integrações</p>
        {INTEGRATIONS.map(integ => {
          const Icon = integ.icon;
          return (
            <div key={integ.id} className="rounded-xl border border-border/40 bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${integ.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: integ.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{integ.name}</p>
                <p className="text-xs text-muted-foreground">{integ.description}</p>
              </div>
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                Ativo
              </span>
            </div>
          );
        })}
      </div>

      {/* Por workspace */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Configuração por workspace ({licenses.length} {licenses.length === 1 ? "workspace" : "workspaces"})
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground/70 py-8 text-center">Nenhum workspace cadastrado.</p>
        ) : (
          <div className="rounded-xl border border-border/35 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-2.5 border-b border-border/25 bg-muted/20">
              {["Workspace", "Plano", "Status"].map(h => (
                <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.07em]">{h}</span>
              ))}
            </div>
            {licenses.map(l => (
              <div key={l.id} className="grid grid-cols-[2fr_1fr_1fr] px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors items-center last:border-0">
                <span className="text-sm font-medium truncate">{l.client_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{l.plan}</span>
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
