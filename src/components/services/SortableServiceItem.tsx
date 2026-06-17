import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Clock, GripVertical, RotateCcw } from "lucide-react";
import type { DisplayItem } from "@/pages/Services";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  item: DisplayItem;
  onEdit: (item: DisplayItem) => void;
  onRestore?: (serviceId: string) => void;
  onToggleActive?: (serviceId: string, active: boolean) => void;
  formatDuration: (mins: number | null) => string;
  formatPrice: (price: number | null, currency: string) => string;
  isDragDisabled?: boolean;
}

const SortableServiceItem = ({ item, onEdit, onRestore, onToggleActive, formatDuration, formatPrice, isDragDisabled }: Props) => {
  const id = item.type === "category" ? `cat-${item.data.id}` : item.data.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  if (item.type === "category") {
    const c = item.data;
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-lg border border-border/50 group cursor-pointer hover:bg-muted transition-colors"
        onClick={() => onEdit(item)}
      >
        {!isDragDisabled && (
          <button
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: c.color || "hsl(var(--primary))" }} />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.name}</span>
        <Button variant="ghost" size="icon" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  const s = item.data;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-4 py-3 bg-card rounded-lg border border-border group cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={() => onEdit(item)}
    >
      {!isDragDisabled && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: s.color || "hsl(var(--primary))" }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{s.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {s.duration_minutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(s.duration_minutes)}
            </span>
          )}
          {s.duration_minutes && s.price != null && <span className="text-xs text-muted-foreground">·</span>}
          {s.price != null && s.price > 0 && (
            <span className="text-xs font-medium text-foreground">{formatPrice(s.price, s.currency)}</span>
          )}
        </div>
      </div>
      {s.archived && (
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Arquivado</span>
      )}
      {!s.archived && onToggleActive && (
        <Switch
          checked={s.active}
          onCheckedChange={(v) => { onToggleActive(s.id, v); }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {s.archived && onRestore && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={(e) => { e.stopPropagation(); onRestore(s.id); }}>
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar
        </Button>
      )}
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
        <Edit className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default SortableServiceItem;
