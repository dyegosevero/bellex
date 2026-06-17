import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronLeft, Bot, Plus, Trash2, Pencil, Zap, CheckCircle2, Loader2, Smartphone, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

const MODELS = [
  { value: "gpt-4o-mini",  label: "GPT-4o Mini (rápido, econômico)" },
  { value: "gpt-4o",       label: "GPT-4o (mais capaz)"             },
  { value: "gpt-4-turbo",  label: "GPT-4 Turbo"                     },
];

interface Agent {
  id: string;
  name: string;
  phone_number_id: string | null;
  system_prompt: string;
  model: string;
  active: boolean;
  n8n_workflow_id: string | null;
}

// Qualificação + ação unificadas numa única linha
interface QualRow {
  status_name:     string;
  description:     string;
  target_stage_id: string | null;
}

interface WaInstance {
  instanceName: string;
  instanceId:   string;
  status:       string;
}

// ─── Hook: EvoAPI instances ──────────────────────────────────────────────────

function useEvoInstances() {
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [loadingInst, setLoadingInst] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingInst(true);
      try {
        const { data: settings } = await supabase
          .from("clinic_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["whatsapp_request_url", "whatsapp_api_key"]);

        if (!settings) return;
        const m = Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value ?? ""]));
        const url = (m.whatsapp_request_url as string || "").replace(/\/$/, "");
        const key = m.whatsapp_api_key as string || "";
        if (!url || !key) return;

        const res  = await fetch(`${url}/instance/fetchInstances`, { headers: { apikey: key } });
        const data = await res.json();
        const raw  = Array.isArray(data) ? data : (data.instances || []);
        setInstances(raw.map((item: any) => {
          const inst = item.instance || item;
          return {
            instanceName: inst.instanceName || inst.name || "",
            instanceId:   inst.instanceId   || inst.id   || "",
            status:       inst.connectionStatus || inst.state || "close",
          };
        }).filter((i: WaInstance) => i.instanceName));
      } catch {} finally { setLoadingInst(false); }
    }
    load();
  }, []);

  return { instances, loadingInst };
}

// ─── Main page ───────────────────────────────────────────────────────────────

const emptyForm = { name: "", phone_number_id: null as string | null, system_prompt: "", model: "gpt-4o-mini", active: true, n8n_workflow_id: null as string | null };

export default function AdminAgentes() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<Agent | null>(null);
  const [form,     setForm]     = useState(emptyForm);
  const [quals,    setQuals]    = useState<QualRow[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  const { instances, loadingInst } = useEvoInstances();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline-stages-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pipeline_stages").select("id, label").order("position");
      if (error) throw error;
      return data as { id: string; label: string }[];
    },
  });

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setQuals([]);
    setOpen(true);
  };

  const openEdit = async (agent: Agent) => {
    setEditing(agent);
    setForm({ name: agent.name, phone_number_id: agent.phone_number_id, system_prompt: agent.system_prompt, model: agent.model, active: agent.active, n8n_workflow_id: agent.n8n_workflow_id });
    const [{ data: q }, { data: a }] = await Promise.all([
      supabase.from("agent_qualifications").select("*").eq("agent_id", agent.id),
      supabase.from("agent_actions").select("*").eq("agent_id", agent.id),
    ]);
    const actionMap = Object.fromEntries((a ?? []).map(x => [x.trigger_status, x.target_stage_id]));
    setQuals((q ?? []).map(x => ({ status_name: x.status_name, description: x.description, target_stage_id: actionMap[x.status_name] ?? null })));
    setOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim())          { toast.error("Nome é obrigatório.");   return; }
    if (!form.system_prompt.trim()) { toast.error("Prompt é obrigatório."); return; }
    setSaving(true);
    try {
      let agentId: string;

      if (editing) {
        const { error } = await supabase.from("agents").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
        if (error) throw error;
        agentId = editing.id;
        await Promise.all([
          supabase.from("agent_qualifications").delete().eq("agent_id", agentId),
          supabase.from("agent_actions").delete().eq("agent_id", agentId),
        ]);
      } else {
        const { data, error } = await supabase.from("agents").insert(form).select().single();
        if (error) throw error;
        agentId = (data as Agent).id;
      }

      if (quals.length > 0) {
        const { error } = await supabase.from("agent_qualifications").insert(
          quals.filter(q => q.status_name.trim()).map(q => ({ agent_id: agentId, status_name: q.status_name.trim(), description: q.description }))
        );
        if (error) throw error;

        const actionsToSave = quals.filter(q => q.status_name.trim() && q.target_stage_id);
        if (actionsToSave.length > 0) {
          await supabase.from("agent_actions").insert(
            actionsToSave.map(q => ({ agent_id: agentId, trigger_status: q.status_name.trim(), action: "move_lead", target_stage_id: q.target_stage_id }))
          );
        }
      }

      // Sync to n8n (best-effort, workflow handles data fetching)
      fetch("https://n8n.axei.link/webhook/bellex-agent-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "agent_saved", agent_id: agentId }),
      }).catch(() => {});

      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success(editing ? "Agente atualizado!" : "Agente criado!");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("agents").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["agents"] });
    toast.success("Agente removido.");
    setDeleteId(null);
  };

  const toggleActive = async (agent: Agent) => {
    await supabase.from("agents").update({ active: !agent.active }).eq("id", agent.id);
    qc.invalidateQueries({ queryKey: ["agents"] });
  };

  const addQual = () => setQuals(q => [...q, { status_name: "", description: "", target_stage_id: null }]);
  const removeQual = (i: number) => setQuals(q => q.filter((_, j) => j !== i));
  const updateQual = (i: number, patch: Partial<QualRow>) => setQuals(q => q.map((x, j) => j === i ? { ...x, ...patch } : x));

  // Prompt com instruções de qualificação appendadas (preview)
  const hasQuals = quals.some(q => q.status_name.trim());
  const qualInstructionPreview = hasQuals
    ? `\n\n---\n## Qualificação (gerado automaticamente)\nQuando identificar que o lead atinge um critério abaixo, inclua EXATAMENTE o marcador no final da mensagem:\n${quals.filter(q => q.status_name.trim()).map(q => `[${q.status_name.trim()}]: ${q.description}`).join("\n")}`
    : "";

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4" /> Configurações
      </Button>

      <BlurFade delay={0.05}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">Agentes de IA</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure agentes que respondem automaticamente por WhatsApp.</p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo Agente
          </Button>
        </div>
      </BlurFade>

      {/* ── Lista ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : agents.length === 0 ? (
        <BlurFade delay={0.1}>
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Bot className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum agente configurado.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Criar primeiro agente
            </Button>
          </div>
        </BlurFade>
      ) : (
        <BlurFade delay={0.1}>
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", agent.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{agent.name}</span>
                    <Badge variant={agent.active ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider px-1.5">
                      {agent.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {agent.phone_number_id && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Smartphone className="w-3 h-3" /> {agent.phone_number_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.system_prompt.slice(0, 90)}{agent.system_prompt.length > 90 ? "…" : ""}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{MODELS.find(m => m.value === agent.model)?.label ?? agent.model}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={agent.active} onCheckedChange={() => toggleActive(agent)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(agent)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(agent.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </BlurFade>
      )}

      {/* ── Modal Criar/Editar ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-light tracking-wider">{editing ? "Editar Agente" : "Novo Agente"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">

            {/* ── Identidade ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome do Agente</Label>
                <Input placeholder="Ex: Qualificador" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Modelo OpenAI</Label>
                <Select value={form.model} onValueChange={v => setForm(f => ({ ...f, model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Instância WhatsApp ── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Instância WhatsApp</Label>
              {loadingInst ? (
                <div className="h-9 rounded-xl border border-border/60 flex items-center px-3 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando instâncias...
                </div>
              ) : instances.length === 0 ? (
                <div className="h-9 rounded-xl border border-dashed border-border flex items-center px-3 gap-2 text-sm text-muted-foreground">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Nenhuma instância — </span>
                  <button className="underline text-primary text-xs" onClick={() => { setOpen(false); navigate("/admin/whatsapp"); }}>
                    configurar WhatsApp
                  </button>
                </div>
              ) : (
                <Select
                  value={form.phone_number_id ?? "__none__"}
                  onValueChange={v => setForm(f => ({ ...f, phone_number_id: v === "__none__" ? null : v }))}
                >
                  <SelectTrigger className="rounded-xl border-border/60">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Selecionar instância…" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma instância</SelectItem>
                    {instances.map(inst => (
                      <SelectItem key={inst.instanceName} value={inst.instanceName}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", inst.status === "open" ? "bg-green-500" : "bg-red-400")} />
                          {inst.instanceName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-[11px] text-muted-foreground">O agente vai responder mensagens desta instância WhatsApp.</p>
            </div>

            {/* ── Prompt ── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Prompt do Sistema</Label>
              <Textarea
                placeholder="Você é um assistente da Clínica X. Seu objetivo é qualificar leads perguntando sobre interesse, disponibilidade e orçamento..."
                className="min-h-[140px] resize-none text-sm font-mono leading-relaxed"
                value={form.system_prompt}
                onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
              />
              {hasQuals && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 mt-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">Instruções de qualificação (adicionadas automaticamente)</span>
                  </div>
                  <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{qualInstructionPreview.trimStart()}</pre>
                </div>
              )}
            </div>

            {/* ── Ativo ── */}
            <div className="flex items-center gap-2">
              <Switch id="active" checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label htmlFor="active" className="text-sm cursor-pointer">Agente ativo</Label>
            </div>

            {/* ── Qualificações + Ações ── */}
            <div className="space-y-3 border-t border-border/40 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">Qualificações <span className="text-xs text-muted-foreground font-normal ml-1">(opcional)</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Critérios que o agente detecta e, opcionalmente, move o lead de etapa.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7 shrink-0" onClick={addQual}>
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>

              {quals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-6 text-center">
                  <p className="text-xs text-muted-foreground">Sem qualificações — o agente responde livremente sem critérios definidos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quals.map((q, i) => (
                    <div key={i} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Nome do status</p>
                            <Input
                              placeholder="Ex: QUALIFICADO"
                              className="h-8 text-xs font-mono uppercase"
                              value={q.status_name}
                              onChange={e => updateQual(i, { status_name: e.target.value.replace(/\s+/g, "_").toUpperCase() })}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Descrição</p>
                            <Input
                              placeholder="Ex: Lead tem interesse e budget"
                              className="h-8 text-xs"
                              value={q.description}
                              onChange={e => updateQual(i, { description: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive mt-5 shrink-0" onClick={() => removeQual(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Ação desta qualificação */}
                      <div className="flex items-center gap-2 pt-1">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <Select
                            value={q.target_stage_id ?? "__none__"}
                            onValueChange={v => updateQual(i, { target_stage_id: v === "__none__" ? null : v })}
                          >
                            <SelectTrigger className="h-7 text-xs rounded-lg border-border/60">
                              <SelectValue placeholder="Sem ação automática" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Sem ação automática</SelectItem>
                              {stages.map(s => <SelectItem key={s.id} value={s.id}>Mover para: {s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSave}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar e Sincronizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar exclusão ── */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover agente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O agente será desvinculado das etapas do pipeline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
