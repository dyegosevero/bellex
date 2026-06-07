import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FaturamentoFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (v: string) => void;
  specialistFilter: string;
  onSpecialistFilterChange: (v: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (v: string) => void;
  specialists: FilterOption[];
  services: FilterOption[];
  onFilter?: () => void;
}

const FaturamentoFilters = ({
  search, onSearchChange,
  paymentFilter, onPaymentFilterChange,
  specialistFilter, onSpecialistFilterChange,
  serviceFilter, onServiceFilterChange,
  specialists, services, onFilter,
}: FaturamentoFiltersProps) => {
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);

  const filteredServices = services.filter((s) =>
    s.label.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const selectedServiceLabel = serviceFilter === "all"
    ? "Todos serviços"
    : services.find((s) => s.value === serviceFilter)?.label ?? "Serviço";

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative max-w-xs flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>
      <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Pagamento" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
        </SelectContent>
      </Select>
      <Select value={specialistFilter} onValueChange={onSpecialistFilterChange}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Especialista" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos especialistas</SelectItem>
          {specialists.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={serviceOpen}
            className="w-48 justify-between font-normal h-10"
          >
            <span className="truncate">{selectedServiceLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Buscar serviço..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            <button
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                serviceFilter === "all" && "bg-accent text-accent-foreground"
              )}
              onClick={() => { onServiceFilterChange("all"); setServiceOpen(false); setServiceSearch(""); }}
            >
              <Check className={cn("mr-2 h-4 w-4", serviceFilter === "all" ? "opacity-100" : "opacity-0")} />
              Todos serviços
            </button>
            {filteredServices.map((s) => (
              <button
                key={s.value}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  serviceFilter === s.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => { onServiceFilterChange(s.value); setServiceOpen(false); setServiceSearch(""); }}
              >
                <Check className={cn("mr-2 h-4 w-4", serviceFilter === s.value ? "opacity-100" : "opacity-0")} />
                {s.label}
              </button>
            ))}
            {filteredServices.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {onFilter && (
        <Button onClick={onFilter} size="default" className="h-10 gap-2">
          <Filter className="w-4 h-4" />
          Filtrar
        </Button>
      )}
    </div>
  );
};

export default FaturamentoFilters;
