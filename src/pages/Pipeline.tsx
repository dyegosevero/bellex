import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Settings2, GripVertical, Phone, Clock, Bot, X, Check, ChevronDown, ArrowLeft, Send, Paperclip, Smile, MapPin, Tag, Calendar, Mail, UserPlus, LayoutList, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  fetchStages, upsertStage, fetchLeads, createLead, moveLead,
  createConversation, fetchMessages, sendMessage,
  type PipelineStage, type Lead, type Message,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_LIST = ["😀","😂","😍","🥰","😊","😎","🤔","😅","😢","😭","😡","🤩","🥳","😴","🤗","😏","😬","🙄","😇","🥺","👍","👎","👏","🙌","🤝","❤️","🔥","✨","🎉","💯","🚀","💪","🙏","💔","😮","🤣","😁","🥶","🤯","😆"];


// ─── Types ─────────────────────────────────────────────────────────────────

type CardData = {
  id: string;
  name: string;
  phone: string;
  source: "whatsapp" | "instagram" | "manual";
  createdAt: string;
  lastMessage: string;
};

type StageAgent = {
  enabled: boolean;
  model: string;
  prompt: string;
  schedule: "always" | "business" | "outside";
};

type Stage = {
  id: string;
  label: string;
  color: string; // hex
  cards: CardData[];
  agent: StageAgent;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const PALETTE = [
  { hex: "#f87171", name: "Vermelho" },
  { hex: "#fb923c", name: "Laranja" },
  { hex: "#fbbf24", name: "Amarelo" },
  { hex: "#4ade80", name: "Verde" },
  { hex: "#34d399", name: "Esmeralda" },
  { hex: "#38bdf8", name: "Azul" },
  { hex: "#818cf8", name: "Índigo" },
  { hex: "#c084fc", name: "Roxo" },
  { hex: "#f472b6", name: "Rosa" },
  { hex: "#94a3b8", name: "Cinza" },
];

const DEFAULT_STAGES: Stage[] = [
  {
    id: "novo",
    label: "Novo Lead",
    color: "#38bdf8",
    cards: [
      { id: "c1", name: "Ana Paula",       phone: "(11) 98888-1234", source: "whatsapp",  createdAt: "Hoje, 09:14",    lastMessage: "Oi, quero saber sobre depilação a laser..." },
      { id: "c2", name: "Beatriz Souza",   phone: "(21) 97777-5678", source: "whatsapp",  createdAt: "Hoje, 08:02",    lastMessage: "Vocês têm horário na sexta à tarde?" },
      { id: "c7", name: "Fernanda Lima",   phone: "(11) 91234-5678", source: "instagram", createdAt: "Hoje, 07:45",    lastMessage: "Vi o post sobre promoção de limpeza de pele!" },
      { id: "c8", name: "Juliana Pires",   phone: "(21) 99876-5432", source: "whatsapp",  createdAt: "Ontem, 22:10",   lastMessage: "Quanto custa o pacote de 6 sessões?" },
      { id: "c9", name: "Renata Almeida",  phone: "(31) 98765-0001", source: "instagram", createdAt: "Ontem, 19:35",   lastMessage: "Adorei o antes e depois! Como funciona?" },
    ],
    agent: { enabled: true, model: "gpt-4o", prompt: "Você é recepcionista virtual. Qualifique o lead perguntando qual serviço tem interesse e o melhor horário.", schedule: "always" },
  },
  {
    id: "qualificando",
    label: "Qualificando",
    color: "#fbbf24",
    cards: [
      { id: "c3",  name: "Carla Mendes",    phone: "(31) 96666-9012", source: "instagram", createdAt: "Ontem, 14:30",  lastMessage: "Tenho interesse em harmonização facial..." },
      { id: "c10", name: "Patricia Lima",   phone: "(11) 97654-3210", source: "whatsapp",  createdAt: "Ontem, 11:20",  lastMessage: "Quero mais info sobre botox preventivo" },
      { id: "c11", name: "Tatiane Rocha",   phone: "(41) 98888-7777", source: "whatsapp",  createdAt: "2 dias atrás",  lastMessage: "Pode me mandar a lista de preços?" },
      { id: "c12", name: "Claudia Santos",  phone: "(21) 96543-2109", source: "instagram", createdAt: "2 dias atrás",  lastMessage: "Qual a diferença entre peeling e microagulhamento?" },
    ],
    agent: { enabled: true, model: "gpt-4o", prompt: "O lead tem interesse confirmado. Apresente os preços e agende uma demonstração.", schedule: "business" },
  },
  {
    id: "proposta",
    label: "Proposta",
    color: "#c084fc",
    cards: [
      { id: "c4",  name: "Daniela Costa",   phone: "(11) 95555-3344", source: "whatsapp",  createdAt: "3 dias atrás",  lastMessage: "Ok, me manda a proposta no WhatsApp" },
      { id: "c13", name: "Mariana Vieira",  phone: "(31) 94444-8899", source: "instagram", createdAt: "3 dias atrás",  lastMessage: "Vou pensar e te aviso até amanhã" },
      { id: "c14", name: "Camila Ferreira", phone: "(11) 93333-1122", source: "whatsapp",  createdAt: "4 dias atrás",  lastMessage: "Quero fechar o pacote completo" },
    ],
    agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "outside" },
  },
  {
    id: "fechado",
    label: "Fechado",
    color: "#4ade80",
    cards: [
      { id: "c5",  name: "Eliane Moreira",  phone: "(21) 94444-5566", source: "whatsapp",  createdAt: "5 dias atrás",  lastMessage: "Fechado! Nos vemos na quinta 🎉" },
      { id: "c6",  name: "Aline Rodrigues", phone: "(11) 93333-7788", source: "instagram", createdAt: "1 semana atrás", lastMessage: "Amei o resultado, já indiquei pra amiga!" },
      { id: "c15", name: "Sandra Oliveira", phone: "(31) 92222-9900", source: "whatsapp",  createdAt: "1 semana atrás", lastMessage: "Confirmado para segunda às 10h ✅" },
    ],
    agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "always" },
  },
];

// ─── Card component (sortable) ──────────────────────────────────────────────

function PipelineCard({ card, isDragging, onOpen }: { card: CardData; isDragging?: boolean; onOpen?: (card: CardData) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background rounded-xl border border-border/50 select-none group",
        "shadow-sm hover:shadow-md hover:border-border transition-all duration-150",
        isDragging && "shadow-xl rotate-1 scale-105 border-primary/30",
      )}
    >
      {/* Clickable body */}
      <div
        className="p-3.5 cursor-pointer"
        onClick={() => onOpen?.(card)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-foreground leading-tight">{card.name}</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
            card.source === "whatsapp" ? "bg-green-100 text-green-700" : card.source === "instagram" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"
          )}>
            {card.source === "whatsapp" ? "WA" : card.source === "instagram" ? "IG" : "Manual"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">{card.lastMessage}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
          <span className="flex items-center gap-1"><Phone size={10} />{card.phone}</span>
          <span className="flex items-center gap-1 ml-auto"><Clock size={10} />{card.createdAt}</span>
        </div>
      </div>
      {/* Drag handle */}
      <div
        className="flex items-center justify-center h-5 border-t border-border/30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={12} className="text-muted-foreground/40" />
      </div>
    </div>
  );
}

// ─── Stage column ───────────────────────────────────────────────────────────

function StageColumn({
  stage,
  onConfigure,
  isOver,
  onOpenCard,
}: {
  stage: Stage;
  onConfigure: (stage: Stage) => void;
  isOver?: boolean;
  onOpenCard: (card: CardData) => void;
}) {
  const cardIds = stage.cards.map(c => c.id);

  // Soft bg from hex color
  const softBg = `${stage.color}18`;
  const borderColor = `${stage.color}40`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl min-w-[272px] max-w-[272px] transition-all duration-200",
        isOver && "scale-[1.01]"
      )}
      style={{ background: softBg, border: `1.5px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{stage.label}</span>
        <span className="text-xs text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full font-medium">
          {stage.cards.length}
        </span>
        {stage.agent.enabled && (
          <span title="Agente ativo" className="w-5 h-5 rounded-full bg-background/80 flex items-center justify-center">
            <Bot size={11} className="text-primary" />
          </span>
        )}
        <button
          onClick={() => onConfigure(stage)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <Settings2 size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className={cn(
        "flex-1 px-3 pb-3 flex flex-col gap-2 min-h-[120px] transition-colors duration-150 rounded-b-2xl",
        isOver && "bg-background/30"
      )}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {stage.cards.map(card => (
            <PipelineCard key={card.id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>

        {stage.cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 py-6">
            Nenhum lead
          </div>
        )}
      </div>

      {/* Add card */}
      <button className="mx-3 mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors rounded-xl px-3 py-2">
        <Plus size={12} />
        Adicionar lead
      </button>
    </div>
  );
}

// ─── Stage Config Dialog ────────────────────────────────────────────────────

function StageConfigDialog({
  stage,
  open,
  onClose,
  onSave,
}: {
  stage: Stage | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Stage) => void;
}) {
  const [draft, setDraft] = useState<Stage | null>(null);

  // Reset draft when stage changes
  if (stage && (!draft || draft.id !== stage.id)) setDraft({ ...stage, agent: { ...stage.agent } });

  if (!draft) return null;

  const update = (patch: Partial<Stage>) => setDraft(d => d ? { ...d, ...patch } : d);
  const updateAgent = (patch: Partial<StageAgent>) => setDraft(d => d ? { ...d, agent: { ...d.agent, ...patch } } : d);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-light">Configurar etapa</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome da etapa</label>
            <input
              value={draft.label}
              onChange={e => update({ label: e.target.value })}
              className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Cor da coluna</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(p => (
                <button
                  key={p.hex}
                  title={p.name}
                  onClick={() => update({ color: p.hex })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: p.hex }}
                >
                  {draft.color === p.hex && <Check size={13} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-full border-2 border-border" style={{ background: draft.color }} />
              <input
                type="color"
                value={draft.color}
                onChange={e => update({ color: e.target.value })}
                className="h-7 w-16 rounded cursor-pointer border border-border"
              />
              <span className="text-xs text-muted-foreground">Personalizada</span>
            </div>
          </div>

          {/* Agent */}
          <div className="space-y-4 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Agente de IA</p>
                <p className="text-xs text-muted-foreground">Responde automaticamente nesta etapa</p>
              </div>
              <Switch
                checked={draft.agent.enabled}
                onCheckedChange={v => updateAgent({ enabled: v })}
              />
            </div>

            {draft.agent.enabled && (
              <div className="space-y-4 bg-muted/30 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Modelo</Label>
                    <Select value={draft.agent.model} onValueChange={v => updateAgent({ model: v })}>
                      <SelectTrigger className="h-9 rounded-xl text-sm border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
                        <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Horário de resposta</Label>
                    <Select value={draft.agent.schedule} onValueChange={v => updateAgent({ schedule: v as StageAgent["schedule"] })}>
                      <SelectTrigger className="h-9 rounded-xl text-sm border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Sempre (24h)</SelectItem>
                        <SelectItem value="business">Horário comercial</SelectItem>
                        <SelectItem value="outside">Fora do horário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Instrução do agente</Label>
                  <textarea
                    value={draft.agent.prompt}
                    onChange={e => updateAgent({ prompt: e.target.value })}
                    rows={4}
                    placeholder="Ex: Você é recepcionista da Clínica X. Qualifique o lead perguntando qual serviço tem interesse..."
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Arquivos de contexto</Label>
                  <p className="text-xs text-muted-foreground">PDFs, documentos ou bases de conhecimento para o agente</p>
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 pointer-events-none" asChild>
                      <span><Paperclip className="w-3.5 h-3.5" /> Anexar arquivo</span>
                    </Button>
                    <input type="file" multiple accept=".pdf,.txt,.docx,.md" className="hidden" onChange={() => {}} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={() => { onSave(draft); onClose(); }}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Detail View ───────────────────────────────────────────────────────

// Messages are now loaded from Supabase in LeadDetail

type CustomField = { id: string; label: string; value: string };

function LeadDetail({ card, onBack }: { card: CardData; onBack: () => void }) {
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoadingMsgs(true);
      try {
        // Fetch conversation for this lead
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("lead_id", card.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const cid = convs?.[0]?.id ?? null;
        setConvId(cid);
        if (cid) {
          const msgs = await fetchMessages(cid);
          setMessages(msgs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMsgs(false);
      }
    }
    load();
  }, [card.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      let cid = convId;
      if (!cid) {
        // Create conversation on first message
        const conv = await createConversation(card.id, card.source === "instagram" ? "instagram" : "whatsapp");
        cid = conv.id;
        setConvId(cid);
      }
      const msg = await sendMessage(cid, text, true);
      setMessages(prev => [...prev, msg]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 gap-3 shrink-0 bg-background">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Voltar ao Pipeline
        </button>
      </div>

      {/* Split body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Lead data (1/3) */}
        <aside className="w-1/3 border-r flex flex-col overflow-y-auto bg-muted/10">
          {/* Lead hero */}
          <div className="p-6 border-b flex flex-col items-center gap-3 text-center relative">
            <button
              onClick={() => setFieldsOpen(v => !v)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              title="Campos customizados"
            >
              <Settings2 size={15} />
            </button>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
              {card.name[0]}
            </div>
            <div>
              <p className="font-semibold text-base">{card.name}</p>
              <span className={cn(
                "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium mt-1",
                card.source === "whatsapp" ? "bg-green-100 text-green-700" : card.source === "instagram" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"
              )}>
                {card.source === "whatsapp" ? "WhatsApp" : card.source === "instagram" ? "Instagram" : "Manual"}
              </span>
            </div>
          </div>

          {/* Campos customizados (editor) */}
          {fieldsOpen && (
            <div className="p-4 border-b bg-background space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Campos customizados</p>
              {customFields.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-muted-foreground">{f.label}</p>
                    <Input
                      value={f.value}
                      onChange={e => setCustomFields(prev => prev.map(x => x.id === f.id ? { ...x, value: e.target.value } : x))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <button onClick={() => setCustomFields(prev => prev.filter(x => x.id !== f.id))} className="text-muted-foreground hover:text-destructive transition-colors mt-4">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do campo..."
                  value={newFieldLabel}
                  onChange={e => setNewFieldLabel(e.target.value)}
                  className="h-7 text-xs flex-1"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newFieldLabel.trim()) {
                      setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, label: newFieldLabel.trim(), value: "" }]);
                      setNewFieldLabel("");
                    }
                  }}
                />
                <Button size="sm" className="h-7 px-2 text-xs" disabled={!newFieldLabel.trim()} onClick={() => {
                  setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, label: newFieldLabel.trim(), value: "" }]);
                  setNewFieldLabel("");
                }}>
                  <Plus size={12} />
                </Button>
              </div>
            </div>
          )}

          {/* Data rows */}
          <div className="p-5 space-y-4">
            <LeadDataRow icon={<Phone size={14} />} label="Telefone" value={card.phone} />
            <LeadDataRow icon={<Clock size={14} />} label="Criado em" value={card.createdAt} />
            <LeadDataRow icon={<Tag size={14} />} label="Canal" value={card.source} />
            <LeadDataRow icon={<MapPin size={14} />} label="Cidade" value="—" />
            <LeadDataRow icon={<Mail size={14} />} label="E-mail" value="—" />
            <LeadDataRow icon={<Calendar size={14} />} label="Último agend." value="—" />
            {customFields.filter(f => f.value).map(f => (
              <LeadDataRow key={f.id} icon={<ChevronDown size={14} />} label={f.label} value={f.value} />
            ))}
          </div>

          {/* Actions */}
          <div className="p-5 border-t mt-auto space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Ações</p>
            <button className="w-full flex items-center gap-2 text-sm text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors">
              <UserPlus size={14} /> Criar cliente
            </button>
            <button className="w-full flex items-center gap-2 text-sm text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors">
              <Calendar size={14} /> Agendar sessão
            </button>
            <button className="w-full flex items-center gap-2 text-sm text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors">
              <Tag size={14} /> Adicionar tag
            </button>
          </div>
        </aside>

        {/* Right: Messages (2/3) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="h-12 border-b flex items-center px-4 shrink-0">
            <p className="text-sm font-medium">Conversa com {card.name}</p>
            <span className={cn(
              "ml-2 text-[10px] px-2 py-0.5 rounded-full",
              card.source === "whatsapp" ? "bg-green-100 text-green-700" : card.source === "instagram" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"
            )}>
              {card.source === "whatsapp" ? "WhatsApp" : card.source === "instagram" ? "Instagram" : "Manual"}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loadingMsgs ? (
              <div className="flex justify-center pt-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground pt-10">Nenhuma mensagem ainda.</p>
            ) : messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.from_me ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[68%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  msg.from_me ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-[10px] mt-1 text-right", msg.from_me ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex items-end gap-2">
            {/* File attachment */}
            <button
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              onClick={() => document.getElementById("lead-file-input")?.click()}
              title="Anexar arquivo"
            >
              <Paperclip size={16} />
            </button>
            <input id="lead-file-input" type="file" multiple className="hidden" onChange={() => {}} />

            {/* Emoji picker */}
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Emoji">
                  <Smile size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      className="text-lg p-1 rounded hover:bg-muted transition-colors"
                      onClick={() => { setInput(v => v + em); setEmojiOpen(false); }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <input
              className="flex-1 h-9 px-3 text-sm bg-muted/50 rounded-lg border border-border/50 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Escreva uma mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button
              disabled={!input.trim() || sending}
              onClick={handleSend}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadDataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

// Map DB types to UI types
function dbStageToUI(s: PipelineStage, leads: Lead[]): Stage {
  return {
    id: s.id,
    label: s.label,
    color: s.color,
    cards: leads
      .filter(l => l.stage_id === s.id)
      .map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone ?? "",
        source: (l.source === "instagram" ? "instagram" : l.source === "whatsapp" ? "whatsapp" : "manual") as CardData["source"],
        createdAt: new Date(l.created_at).toLocaleDateString("pt-BR"),
        lastMessage: l.last_message ?? "",
      })),
    agent: {
      enabled: s.agent_enabled,
      model: s.agent_model ?? "gpt-4o",
      prompt: s.agent_prompt ?? "",
      schedule: (s.agent_schedule as StageAgent["schedule"]) ?? "always",
    },
  };
}

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);
  const [configStage, setConfigStage] = useState<Stage | null>(null);
  const [selectedLead, setSelectedLead] = useState<CardData | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: "", phone: "", stageId: "", source: "manual" as CardData["source"] });

  useEffect(() => {
    async function load() {
      try {
        const [dbStages, dbLeads] = await Promise.all([fetchStages(), fetchLeads()]);
        setStages(dbStages.map(s => dbStageToUI(s, dbLeads)));
      } catch (e) {
        console.error("Pipeline load error", e);
        // Fallback to empty
        setStages([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Find which stage a card belongs to
  const findStage = useCallback((cardId: string) =>
    stages.find(s => s.cards.some(c => c.id === cardId)), [stages]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const card = stages.flatMap(s => s.cards).find(c => c.id === active.id);
    if (card) setActiveCard(card);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) { setOverStageId(null); return; }

    // over could be a stage id or a card id
    const overId = String(over.id);
    const isStage = stages.some(s => s.id === overId);
    if (isStage) { setOverStageId(overId); return; }

    const overStage = findStage(overId);
    setOverStageId(overStage?.id ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    setOverStageId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromStage = findStage(activeId);
    if (!fromStage) return;

    // Target: is it a stage or a card?
    const toStage = stages.find(s => s.id === overId) ?? findStage(overId);
    if (!toStage) return;

    if (fromStage.id === toStage.id) {
      // Reorder within same column
      const oldIdx = fromStage.cards.findIndex(c => c.id === activeId);
      const newIdx = toStage.cards.findIndex(c => c.id === overId);
      if (oldIdx === newIdx || newIdx === -1) return;
      setStages(prev => prev.map(s =>
        s.id === fromStage.id ? { ...s, cards: arrayMove(s.cards, oldIdx, newIdx) } : s
      ));
    } else {
      // Move to different column
      const card = fromStage.cards.find(c => c.id === activeId)!;
      const insertIdx = toStage.cards.findIndex(c => c.id === overId);
      setStages(prev => prev.map(s => {
        if (s.id === fromStage.id) return { ...s, cards: s.cards.filter(c => c.id !== activeId) };
        if (s.id === toStage.id) {
          const newCards = [...s.cards];
          newCards.splice(insertIdx === -1 ? newCards.length : insertIdx, 0, card);
          return { ...s, cards: newCards };
        }
        return s;
      }));
      // Persist to Supabase
      moveLead(activeId, toStage.id).catch(console.error);
    }
  }

  async function addStage() {
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)].hex;
    const position = stages.length;
    try {
      const saved = await upsertStage({ label: "Nova etapa", color, position, agent_enabled: false });
      const newStage: Stage = {
        id: saved.id,
        label: saved.label,
        color: saved.color,
        cards: [],
        agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "always" },
      };
      setStages(prev => [...prev, newStage]);
      setConfigStage(newStage);
    } catch (e) {
      console.error(e);
    }
  }

  async function saveStage(updated: Stage) {
    setStages(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    // Persist
    upsertStage({
      id: updated.id,
      label: updated.label,
      color: updated.color,
      agent_enabled: updated.agent.enabled,
      agent_model: updated.agent.model,
      agent_prompt: updated.agent.prompt,
      agent_schedule: updated.agent.schedule,
    }).catch(console.error);
  }

  if (selectedLead) {
    return <LeadDetail card={selectedLead} onBack={() => setSelectedLead(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background flex-shrink-0">
        <PageHeader
          icon={<LayoutList className="w-5 h-5" />}
          title="Pipeline"
          subtitle={loading ? "Carregando..." : `${stages.reduce((acc, s) => acc + s.cards.length, 0)} leads · ${stages.length} etapas`}
          className="mb-0"
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => { setNewLeadForm({ name: "", phone: "", stageId: stages[0]?.id ?? "", source: "manual" }); setNewLeadOpen(true); }} className="gap-1.5">
            <Plus size={14} /> Novo Lead
          </Button>
        <button
          onClick={addStage}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/60 hover:border-border rounded-xl px-3 py-1.5 transition-colors"
        >
          <Plus size={14} />
          Nova etapa
        </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 h-full items-start">
            {stages.map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                onConfigure={setConfigStage}
                isOver={overStageId === stage.id}
                onOpenCard={setSelectedLead}
              />
            ))}

            <button
              onClick={addStage}
              className="min-w-[272px] max-w-[272px] h-24 rounded-2xl border-2 border-dashed border-border/40 flex items-center justify-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground hover:border-border/60 transition-colors flex-shrink-0"
            >
              <Plus size={15} />
              Adicionar etapa
            </button>
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeCard && <PipelineCard card={activeCard} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      <StageConfigDialog
        stage={configStage}
        open={!!configStage}
        onClose={() => setConfigStage(null)}
        onSave={saveStage}
      />

      {/* ── Painel lateral: Novo Lead ── */}
      {newLeadOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setNewLeadOpen(false)}>
          <div
            className="relative bg-background border-l border-border shadow-2xl w-full max-w-sm h-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h2 className="text-base font-medium">Novo Lead</h2>
              <button onClick={() => setNewLeadOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Nome</Label>
                <Input
                  placeholder="Nome do lead"
                  value={newLeadForm.name}
                  onChange={e => setNewLeadForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
                <Input
                  placeholder="+55 (11) 99999-0000"
                  value={newLeadForm.phone}
                  onChange={e => setNewLeadForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Etapa</Label>
                <Select value={newLeadForm.stageId} onValueChange={v => setNewLeadForm(f => ({ ...f, stageId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Origem</Label>
                <Select value={newLeadForm.source} onValueChange={v => setNewLeadForm(f => ({ ...f, source: v as CardData["source"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/60 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setNewLeadOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                disabled={!newLeadForm.name.trim() || !newLeadForm.stageId}
                onClick={async () => {
                  try {
                    const lead = await createLead({
                      name: newLeadForm.name.trim(),
                      phone: newLeadForm.phone || null,
                      email: null,
                      source: newLeadForm.source,
                      stage_id: newLeadForm.stageId,
                      last_message: null,
                      notes: null,
                    });
                    // Also create a conversation so it shows in Mensagens
                    await createConversation(lead.id, newLeadForm.source === "instagram" ? "instagram" : "whatsapp");
                    const card: CardData = {
                      id: lead.id,
                      name: lead.name,
                      phone: lead.phone ?? "",
                      source: newLeadForm.source,
                      createdAt: new Date().toLocaleDateString("pt-BR"),
                      lastMessage: "",
                    };
                    setStages(prev => prev.map(s =>
                      s.id === newLeadForm.stageId ? { ...s, cards: [card, ...s.cards] } : s
                    ));
                    setNewLeadOpen(false);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Adicionar Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
