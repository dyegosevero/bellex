import { useState } from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  value: DateRangeValue | null;
  onChange: (v: DateRangeValue | null) => void;
  className?: string;
}

type PeriodKey = "hoje" | "semana" | "mes" | "trimestre" | "30d" | "custom";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "hoje",      label: "Hoje" },
  { key: "semana",    label: "Semana" },
  { key: "mes",       label: "Mês" },
  { key: "trimestre", label: "Trimestre" },
  { key: "30d",       label: "30 dias" },
  { key: "custom",    label: "Personalizado" },
];

function getPeriodRange(key: PeriodKey): DateRangeValue {
  const now = new Date();
  switch (key) {
    case "hoje":      return { from: startOfDay(now), to: endOfDay(now) };
    case "semana":    return { from: startOfWeek(now, { locale: ptBR }), to: endOfWeek(now, { locale: ptBR }) };
    case "mes":       return { from: startOfMonth(now), to: endOfMonth(now) };
    case "trimestre": return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "30d":       return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    default:          return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

function fmtRange(v: DateRangeValue) {
  const sameYear = v.from.getFullYear() === v.to.getFullYear();
  const fmt = (d: Date) => format(d, sameYear ? "d MMM" : "d MMM yyyy", { locale: ptBR });
  if (v.from.toDateString() === v.to.toDateString()) return fmt(v.from);
  return `${fmt(v.from)} – ${fmt(v.to)}`;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [activePeriod, setActivePeriod] = useState<PeriodKey | null>(null);

  function selectPeriod(key: PeriodKey) {
    if (key === "custom") {
      setCustomOpen(true);
      return;
    }
    setActivePeriod(key);
    onChange(getPeriodRange(key));
  }

  function applyCustom() {
    if (customRange?.from && customRange?.to) {
      setActivePeriod("custom");
      onChange({ from: startOfDay(customRange.from), to: endOfDay(customRange.to) });
      setCustomOpen(false);
    } else if (customRange?.from) {
      setActivePeriod("custom");
      onChange({ from: startOfDay(customRange.from), to: endOfDay(customRange.from) });
      setCustomOpen(false);
    }
  }

  function clear() {
    setActivePeriod(null);
    setCustomRange(undefined);
    onChange(null);
  }

  const hasValue = value !== null;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <span className="text-xs text-muted-foreground mr-0.5">Período:</span>
      {PERIODS.map((p) =>
        p.key === "custom" ? (
          <Popover key="custom" open={customOpen} onOpenChange={setCustomOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all",
                  activePeriod === "custom" && hasValue
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
                onClick={() => setCustomOpen(true)}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {activePeriod === "custom" && value ? fmtRange(value) : "Personalizado"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">Selecione o intervalo</p>
                {customRange?.from && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {customRange.to
                      ? `${format(customRange.from, "d MMM yyyy", { locale: ptBR })} – ${format(customRange.to, "d MMM yyyy", { locale: ptBR })}`
                      : `De ${format(customRange.from, "d MMM yyyy", { locale: ptBR })}`}
                  </p>
                )}
              </div>
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={customRange}
                onSelect={setCustomRange}
                locale={ptBR}
                className="p-3"
              />
              <div className="flex items-center justify-end gap-2 p-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={applyCustom} disabled={!customRange?.from}>Aplicar</Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={p.key}
            onClick={() => selectPeriod(p.key)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-medium border transition-all",
              activePeriod === p.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {p.label}
          </button>
        )
      )}
      {hasValue && (
        <button
          onClick={clear}
          className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Limpar filtro de data"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
