import { useState, useCallback } from "react";
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
import { Plus, Settings2, GripVertical, Phone, Clock, Bot, X, Check, ChevronDown } from "lucide-react";
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
      { id: "c1", name: "Ana Paula", phone: "(11) 98888-1234", source: "whatsapp", createdAt: "Hoje, 09:14", lastMessage: "Oi, quero saber sobre depilação..." },
      { id: "c2", name: "Beatriz Souza", phone: "(21) 97777-5678", source: "whatsapp", createdAt: "Hoje, 08:02", lastMessage: "Vocês têm horário na sexta?" },
    ],
    agent: { enabled: true, model: "gpt-4o", prompt: "Você é recepcionista virtual. Qualifique o lead perguntando qual serviço tem interesse e o melhor horário.", schedule: "always" },
  },
  {
    id: "qualificando",
    label: "Qualificando",
    color: "#fbbf24",
    cards: [
      { id: "c3", name: "Carla Mendes", phone: "(31) 96666-9012", source: "instagram", createdAt: "Ontem, 14:30", lastMessage: "Tenho interesse em harmonização..." },
    ],
    agent: { enabled: true, model: "gpt-4o", prompt: "O lead tem interesse confirmado. Apresente os preços e agende uma demonstração.", schedule: "business" },
  },
  {
    id: "proposta",
    label: "Proposta",
    color: "#c084fc",
    cards: [],
    agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "outside" },
  },
  {
    id: "fechado",
    label: "Fechado",
    color: "#4ade80",
    cards: [],
    agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "always" },
  },
];

// ─── Card component (sortable) ──────────────────────────────────────────────

function PipelineCard({ card, isDragging }: { card: CardData; isDragging?: boolean }) {
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
        "bg-background rounded-xl border border-border/50 p-3.5 cursor-grab active:cursor-grabbing select-none",
        "shadow-sm hover:shadow-md hover:border-border transition-all duration-150",
        isDragging && "shadow-xl rotate-1 scale-105 border-primary/30",
      )}
      {...attributes}
      {...listeners}
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
  );
}

// ─── Stage column ───────────────────────────────────────────────────────────

function StageColumn({
  stage,
  onConfigure,
  isOver,
}: {
  stage: Stage;
  onConfigure: (stage: Stage) => void;
  isOver?: boolean;
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
            <PipelineCard key={card.id} card={card} />
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
      <DialogContent className="sm:max-w-md">
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
          <div className="space-y-3 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Agente de IA</p>
                <p className="text-xs text-muted-foreground">Responde automaticamente nesta etapa</p>
              </div>
              <button
                onClick={() => updateAgent({ enabled: !draft.agent.enabled })}
                className={cn(
                  "w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0",
                  draft.agent.enabled ? "bg-primary" : "bg-muted"
                )}
                style={{ height: 22, width: 40 }}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  draft.agent.enabled ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {draft.agent.enabled && (
              <div className="space-y-3 pl-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Modelo</label>
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
                  <label className="text-xs font-medium text-muted-foreground">Horário de resposta</label>
                  <Select value={draft.agent.schedule} onValueChange={v => updateAgent({ schedule: v as StageAgent["schedule"] })}>
                    <SelectTrigger className="h-9 rounded-xl text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Sempre (24h)</SelectItem>
                      <SelectItem value="business">Dentro do horário comercial</SelectItem>
                      <SelectItem value="outside">Fora do horário comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Instrução do agente</label>
                  <textarea
                    value={draft.agent.prompt}
                    onChange={e => updateAgent({ prompt: e.target.value })}
                    rows={4}
                    placeholder="Ex: Você é recepcionista da Clínica X. Qualifique o lead perguntando qual serviço tem interesse..."
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              className="flex-1 h-9 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);
  const [configStage, setConfigStage] = useState<Stage | null>(null);

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
    }
  }

  function addStage() {
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      label: "Nova etapa",
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)].hex,
      cards: [],
      agent: { enabled: false, model: "gpt-4o", prompt: "", schedule: "always" },
    };
    setStages(prev => [...prev, newStage]);
    setConfigStage(newStage);
  }

  function saveStage(updated: Stage) {
    setStages(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  }

  return (
    <div className="h-full flex flex-col -m-6 lg:-m-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-background flex-shrink-0">
        <div>
          <h1 className="text-xl font-light text-foreground tracking-tight">Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stages.reduce((acc, s) => acc + s.cards.length, 0)} leads · {stages.length} etapas
          </p>
        </div>
        <button
          onClick={addStage}
          className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/60 hover:border-border rounded-xl px-3 py-1.5 transition-colors"
        >
          <Plus size={14} />
          Nova etapa
        </button>
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
              />
            ))}

            {/* Add column ghost */}
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
    </div>
  );
}
