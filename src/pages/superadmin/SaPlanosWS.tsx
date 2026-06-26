import { CreditCard, Zap, HardDrive, Building2, Check } from "lucide-react";

const WS_PLANS = [
  {
    name: "WS Starter",
    price: 500,
    color: "#60a5fa",
    seats: 5,
    storage_gb: 50,
    ai_conversations: 1250,
    features: ["Até 5 clínicas ativas", "Suporte por e-mail", "Branding personalizado", "Agente IA por clínica"],
    popular: false,
  },
  {
    name: "WS Pro",
    price: 750,
    color: "#a78bfa",
    seats: 10,
    storage_gb: 100,
    ai_conversations: 6000,
    features: ["Até 10 clínicas ativas", "Suporte prioritário", "Branding personalizado", "Agente IA por clínica", "Relatórios avançados"],
    popular: true,
  },
  {
    name: "WS Scale",
    price: 1000,
    color: "#e8957a",
    seats: 20,
    storage_gb: 200,
    ai_conversations: 20000,
    features: ["Até 20 clínicas ativas", "Suporte dedicado", "White-label total", "Agente IA por clínica", "SLA garantido"],
    popular: false,
  },
];

export default function SaPlanosWS() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="mb-1">
        <h1 className="text-lg font-semibold text-foreground">Planos WS</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Planos que você (Bellex) oferece para operadores de Workspace</p>
      </div>

      <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 text-sm text-blue-800">
        Estes são os planos que a <strong>Bellex vende para parceiros</strong> que querem operar um Workspace White-Label — diferentes dos planos de clínica que cada workspace oferece para seus próprios clientes.
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {WS_PLANS.map(p => (
          <div key={p.name} className="relative rounded-xl border border-border/40 bg-card overflow-hidden">
            {p.popular && (
              <div className="absolute top-3.5 right-3.5">
                <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">Popular</span>
              </div>
            )}
            <div className="h-1" style={{ background: p.color }} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-base font-bold text-foreground">{p.name}</p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-3xl font-bold text-foreground">R$ {p.price.toLocaleString("pt-BR")}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{p.seats} seats</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" />{p.ai_conversations.toLocaleString()} conv. IA</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><HardDrive className="w-3 h-3" />{p.storage_gb} GB</span>
                </div>
              </div>
              <div className="space-y-2 pt-1 border-t border-border/30">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Check className="w-3 h-3 shrink-0" style={{ color: p.color }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
