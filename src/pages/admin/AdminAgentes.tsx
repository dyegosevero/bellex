import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ChevronLeft, Bot, Plus, Trash2, Pencil, Zap, Target, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (rápido, barato)" },
  { value: "gpt-4o", label: "GPT-4o (mais capaz)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
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

interface Qualification {
  id: string;
  agent_id: string;
  description: string;
  status_name: string;
}

interface Action {
  id: string;
  agent_id: string;
  trigger_status: string;
  action: string;
  target_stage_id: string | null;
}

const emptyAgent: Omit<Agent, "id"> = {
  name: "",
  phone_number_id: null,
  system_prompt: "",
  model: "gpt-4o-mini",
  active: true,
  n8n_workflow_id: null,
};

export default function AdminAgentes() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>(emptyAgent);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Qualifications/actions editing (inline inside modal)
  const [quals, setQuals] = useState<Omit<Qualification, "id" | "agent_id">[]>([]);
  const [actions, setActions] = useState<Omit<Action, "id" | "agent_id">[]>([]);

  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline-stages-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("id, label")
        .order("position");
      if (error) throw error;
      return data as { id: string; label: string }[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyAgent);
    setQuals([]);
    setActions([]);
    setOpen(true);
  };

  const openEdit = async (agent: Agent) => {
    setEditing(agent);
    setForm({ name: agent.name, phone_number_id: agent.phone_number_id, system_prompt: agent.system_prompt, model: agent.model, active: agent.active, n8n_workflow_id: agent.n8n_workflow_id });
    // Load quals and actions
    const [{ data: q }, { data: a }] = await Promise.all([
      supabase.from("agent_qualifications").select("*").eq("agent_id", agent.id),
      supabase.from("agent_actions").select("*").eq("agent_id", agent.id),
    ]);
    setQuals((q ?? []).map(x => ({ description: x.description, status_name: x.status_name })));
    setActions((a ?? []).map(x => ({ trigger_status: x.trigger_status, action: x.action, target_stage_id: x.target_stage_id })));
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      toast.error("Nome e prompt são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      let agentId: string;
      if (editing) {
        const { error } = await supabase.from("agents").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
        if (error) throw error;
        agentId = editing.id;
        // Delete old quals/actions
        await Promise.all([
          supabase.from("agent_qualifications").delete().eq("agent_id", agentId),
          supabase.from("agent_actions").delete().eq("agent_id", agentId),
        ]);
      } else {
        const { data, error } = await supabase.from("agents").insert(form).select().single();
        if (error) throw error;
        agentId = (data as Agent).id;
      }
      // Insert quals
      if (quals.length > 0) {
        const { error } = await supabase.from("agent_qualifications").insert(quals.map(q => ({ ...q, agent_id: agentId })));
        if (error) throw error;
      }
      // Insert actions
      if (actions.length > 0) {
        const { error } = await supabase.from("agent_actions").insert(actions.map(a => ({ ...a, agent_id: agentId })));
        if (error) throw error;
      }

      // Sync to n8n
      const N8N_SYNC = "https://n8n.axei.link/webhook/bellex-agent-sync";
      await fetch(N8N_SYNC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, prompt: form.system_prompt, model: form.model, qualifications: quals, actions }),
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
    const { error } = await supabase.from("agents").update({ active: !agent.active }).eq("id", agent.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["agents"] });
  };

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
            {agents.map((agent) => (
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
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.system_prompt.slice(0, 80)}...</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{MODELS.find(m => m.value === agent.model)?.label ?? agent.model}</span>
                    {agent.n8n_workflow_id && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> n8n sincronizado</span>}
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

      {/* Modal Criar/Editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-light tracking-wider">{editing ? "Editar Agente" : "Novo Agente"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Info básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome do Agente</Label>
                <Input placeholder="Ex: Qualificador" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Modelo</Label>
                <Select value={form.model} onValueChange={v => setForm(f => ({ ...f, model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Número de WhatsApp (instância)</Label>
              <Input placeholder="Ex: 5511999990000" value={form.phone_number_id ?? ""} onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value || null }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Prompt do Sistema</Label>
              <Textarea
                placeholder="Você é um assistente de qualificação para a clínica X. Seu objetivo é..."
                className="min-h-[120px] resize-none text-sm"
                value={form.system_prompt}
                onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="active" checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label htmlFor="active" className="text-sm">Agente ativo</Label>
            </div>

            {/* Qualificações */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">Qualificações</p>
                  <p className="text-xs text-muted-foreground">Defina quando o lead está qualificado</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setQuals(q => [...q, { description: "", status_name: "" }])}>
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>
              {quals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-xl">Sem qualificações — o agente responde livremente</p>
              ) : (
                <div className="space-y-2">
                  {quals.map((q, i) => (
                    <div key={i} className="flex gap-2 items-start rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Status (ex: Qualificado, Sem interesse)"
                          className="h-8 text-xs"
                          value={q.status_name}
                          onChange={e => setQuals(arr => arr.map((x, j) => j === i ? { ...x, status_name: e.target.value } : x))}
                        />
                        <Input
                          placeholder="Descrição (ex: Lead tem budget e interesse confirmado)"
                          className="h-8 text-xs"
                          value={q.description}
                          onChange={e => setQuals(arr => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-0.5" onClick={() => setQuals(arr => arr.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ações */}
            {quals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Ações Automáticas</p>
                    <p className="text-xs text-muted-foreground">O que fazer quando um status for atingido</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setActions(a => [...a, { trigger_status: "", action: "move_lead", target_stage_id: null }])}>
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                </div>
                {actions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-xl">Sem ações automáticas</p>
                ) : (
                  <div className="space-y-2">
                    {actions.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center rounded-xl border border-border bg-muted/20 p-3">
                        <Target className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Select value={a.trigger_status} onValueChange={v => setActions(arr => arr.map((x, j) => j === i ? { ...x, trigger_status: v } : x))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Quando status for..." /></SelectTrigger>
                            <SelectContent>
                              {quals.filter(q => q.status_name.trim()).map(q => (
                                <SelectItem key={q.status_name} value={q.status_name}>{q.status_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={a.target_stage_id ?? ""} onValueChange={v => setActions(arr => arr.map((x, j) => j === i ? { ...x, target_stage_id: v || null } : x))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Mover para etapa..." /></SelectTrigger>
                            <SelectContent>
                              {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setActions(arr => arr.filter((_, j) => j !== i))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSave}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
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
