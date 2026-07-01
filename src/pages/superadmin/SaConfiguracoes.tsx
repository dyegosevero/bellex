import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, Shield, Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Config = {
  alert_email: string;
  storage_alert_pct: string;
  ia_alert_pct: string;
};

const DEFAULTS: Config = {
  alert_email: "",
  storage_alert_pct: "80",
  ia_alert_pct: "90",
};

export default function SaConfiguracoes() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("sa_configuration")
      .select("key, value")
      .then(({ data }) => {
        if (data?.length) {
          const map: Record<string, string> = {};
          data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value ?? ""; });
          setCfg(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Config, val: string) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(cfg) as [string, string][];
    const errors: string[] = [];
    for (const [key, value] of entries) {
      const { error } = await supabase.rpc("upsert_sa_config", { p_key: key, p_value: value });
      if (error) errors.push(key);
    }
    setSaving(false);
    if (errors.length) {
      toast({ title: "Erro ao salvar", description: errors.join(", "), variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas." });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader icon={<Settings className="w-5 h-5" />} title="Configurações" subtitle="Parâmetros globais da plataforma Bellex" />

      {/* Alertas */}
      <section className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
          <Bell className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-medium">Alertas automáticos</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label className="text-xs">E-mail para alertas</Label>
            <Input
              type="email"
              placeholder="admin@bellex.app"
              value={cfg.alert_email}
              onChange={e => set("alert_email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Alerta de storage (%)</Label>
            <Input
              type="number"
              min="1" max="100"
              placeholder="80"
              value={cfg.storage_alert_pct}
              onChange={e => set("storage_alert_pct", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Alerta de uso de IA (%)</Label>
            <Input
              type="number"
              min="1" max="100"
              placeholder="90"
              value={cfg.ia_alert_pct}
              onChange={e => set("ia_alert_pct", e.target.value)}
            />
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
          <p className="text-sm">Apenas usuários com acesso ao domínio <code className="text-xs bg-muted px-1 py-0.5 rounded">sa.bellex.beauty</code> com conta Supabase válida.</p>
          <p className="text-xs text-muted-foreground">Autenticação via Supabase Auth — RLS bloqueia queries de outros contextos.</p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
