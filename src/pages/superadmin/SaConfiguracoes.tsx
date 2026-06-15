import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, Shield, Bell, Zap } from "lucide-react";

const CFG_KEY = "sa_global_config";

type Config = {
  platformName: string;
  supportEmail: string;
  webhookSecret: string;
  alertEmail: string;
  storageAlertAt: string;
  iaAlertAt: string;
  maintenanceMode: boolean;
  newSignupsEnabled: boolean;
  trialDays: string;
};

const DEFAULT_CFG: Config = {
  platformName: "Bellex",
  supportEmail: "",
  webhookSecret: "",
  alertEmail: "",
  storageAlertAt: "80",
  iaAlertAt: "90",
  maintenanceMode: false,
  newSignupsEnabled: true,
  trialDays: "14",
};

export default function SaConfiguracoes() {
  const [cfg, setCfg] = useState<Config>(() => {
    try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY) ?? "{}") }; }
    catch { return DEFAULT_CFG; }
  });

  const set = (key: keyof Config, val: string | boolean) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    try {
      localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
      toast({ title: "Configurações salvas." });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <PageHeader icon={<Settings className="w-5 h-5" />} title="Configurações" subtitle="Parâmetros globais da plataforma Bellex" />

      {/* Plataforma */}
      <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Plataforma</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome da plataforma</Label>
            <Input value={cfg.platformName} onChange={e => set("platformName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail de suporte</Label>
            <Input type="email" placeholder="suporte@bellex.app" value={cfg.supportEmail} onChange={e => set("supportEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trial padrão (dias)</Label>
            <Input type="number" placeholder="14" value={cfg.trialDays} onChange={e => set("trialDays", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook secret global</Label>
            <Input type="password" placeholder="whsec_…" value={cfg.webhookSecret} onChange={e => set("webhookSecret", e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo de manutenção</p>
              <p className="text-xs text-muted-foreground">Bloqueia acesso de tenants ao app (superadmin continua acessando).</p>
            </div>
            <Switch checked={cfg.maintenanceMode} onCheckedChange={v => set("maintenanceMode", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Novos signups ativos</p>
              <p className="text-xs text-muted-foreground">Permite que novos clientes se cadastrem via landing page.</p>
            </div>
            <Switch checked={cfg.newSignupsEnabled} onCheckedChange={v => set("newSignupsEnabled", v)} />
          </div>
        </div>
      </section>

      {/* Alertas */}
      <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
          <Bell className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-medium">Alertas automáticos</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail para alertas</Label>
            <Input type="email" placeholder="admin@bellex.app" value={cfg.alertEmail} onChange={e => set("alertEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Alerta de storage (%)</Label>
            <Input type="number" placeholder="80" value={cfg.storageAlertAt} onChange={e => set("storageAlertAt", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Alerta de uso de IA (%)</Label>
            <Input type="number" placeholder="90" value={cfg.iaAlertAt} onChange={e => set("iaAlertAt", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
          <Shield className="w-4 h-4 text-green-500" />
          <p className="text-sm font-medium">Segurança</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acesso Super Admin</p>
          <p className="text-sm">Apenas usuários com role <code className="text-xs bg-muted px-1 py-0.5 rounded">super_admin</code> no Supabase têm acesso a este painel.</p>
          <p className="text-xs text-muted-foreground">A verificação de role ocorre via RLS — não é possível bypasear via frontend.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800">
            <strong>Atenção:</strong> As chaves de integração salvas localmente no navegador são temporárias.
            Implemente <code className="bg-amber-100 px-1 rounded">tenant_integrations</code> no Supabase com criptografia (SA-backend) antes de ir para produção com chaves reais.
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Salvar configurações
        </Button>
      </div>
    </div>
  );
}
