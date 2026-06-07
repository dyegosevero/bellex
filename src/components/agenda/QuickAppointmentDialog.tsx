import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { withTimezoneOffset } from "@/lib/date";
import { useServices, useSpecialists } from "@/hooks/useAppointmentData";
import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useClinicCountry } from "@/hooks/useClinicCountry";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserPlus, Search, X, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { fireBookingWebhook } from "@/lib/webhook";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    specialistId?: string;
  };
}

export function QuickAppointmentDialog({ open, onOpenChange, defaults }: Props) {
  const queryClient = useQueryClient();
  const { user, isSpecialist } = useAuth();
  const clinicCountry = useClinicCountry();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const { data: services } = useServices();
  const { data: specialists } = useSpecialists();
  const [loading, setLoading] = useState(false);
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [multiServiceFilter, setMultiServiceFilter] = useState("");

  // Appointment fields
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  // Client fields (for new or auto-filled)
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);

  // Fetch clinic settings for multi-service
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-multi"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("allow_multi_service_booking").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const allowMultiService = clinicSettings?.allow_multi_service_booking === true;

  // Fetch service categories
  const { data: serviceCategories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("display_order").order("name");
      if (error) throw error;
      return data as Tables<"service_categories">[];
    },
  });

  // Group services by category
  const groupedServices = useMemo(() => {
    if (!services) return [];
    const catMap = new Map<string | null, { name: string; services: typeof services }>();
    const uncategorized: typeof services = [];
    for (const s of services) {
      if (!s.category_id) { uncategorized.push(s); continue; }
      if (!catMap.has(s.category_id)) {
        const cat = serviceCategories?.find(c => c.id === s.category_id);
        catMap.set(s.category_id, { name: cat?.name ?? "Outros", services: [] });
      }
      catMap.get(s.category_id)!.services.push(s);
    }
    const groups = Array.from(catMap.entries()).map(([id, g]) => ({ id, ...g }));
    if (uncategorized.length > 0) groups.push({ id: null, name: "Sem categoria", services: uncategorized });
    return groups;
  }, [services, serviceCategories]);

  // Reset form when defaults change
  useEffect(() => {
    if (open) {
      setDate(defaults?.date ?? new Date().toISOString().split("T")[0]);
      setStartTime(defaults?.startTime ?? "");
      setEndTime(defaults?.endTime ?? "");
      setSpecialistId(isSpecialist && user?.id ? user.id : (defaults?.specialistId ?? ""));
      setServiceId("");
      setSelectedServiceIds([]);
      setClientId("");
      setClientSearch("");
      setClientPhone("");
      setClientEmail("");
      setNotes("");
      setIsNewClient(false);
    }
  }, [open, defaults]);

  // Search clients
  const { data: clients } = useQuery({
    queryKey: ["client-search-quick", clientSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_clients", {
        search_term: clientSearch,
        page_size: 8,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: clientSearch.length >= 2 && !clientId,
  });

  // Primary service for specialist filtering
  const primaryServiceId = allowMultiService ? selectedServiceIds[0] ?? "" : serviceId;

  // Fetch service specialists
  const { data: serviceSpecialists } = useQuery({
    queryKey: ["service-specialists", primaryServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_specialists")
        .select("specialist_id")
        .eq("service_id", primaryServiceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!primaryServiceId,
  });

  // Compute total duration for multi-service
  const totalDuration = useMemo(() => {
    if (!services) return 0;
    const ids = allowMultiService ? selectedServiceIds : (serviceId ? [serviceId] : []);
    return ids.reduce((sum, id) => {
      const svc = services.find((s) => s.id === id);
      return sum + (svc?.duration_minutes || 30);
    }, 0);
  }, [services, allowMultiService, selectedServiceIds, serviceId]);

  // Auto-calculate end time when service/services change
  useEffect(() => {
    if (totalDuration > 0 && startTime) {
      const [h, m] = startTime.split(":").map(Number);
      const totalMin = h * 60 + m + totalDuration;
      const eh = Math.floor(totalMin / 60);
      const em = totalMin % 60;
      setEndTime(`${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
    }
  }, [totalDuration, startTime]);

  // Filter specialists based on service_specialists
  const filteredSpecialists = specialists?.filter((s) => {
    if (!serviceSpecialists || serviceSpecialists.length === 0) return true;
    return serviceSpecialists.some((ss) => ss.specialist_id === s.user_id);
  });

  // Date display
  const dateDisplay = useMemo(() => {
    if (!date) return "";
    try {
      return format(new Date(date + "T12:00:00"), "EEEE, d 'de' MMMM yyyy", { locale: pt });
    } catch { return date; }
  }, [date]);

  const selectClient = (c: any) => {
    setClientId(c.id);
    setClientSearch(c.full_name);
    setClientPhone(c.phone || "");
    setClientEmail(c.email || "");
    setIsNewClient(false);
  };

  const handleCreateNewClient = () => {
    setIsNewClient(true);
    setClientId("");
  };

  const handleMultiServiceToggle = (svcId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(svcId) ? prev.filter((id) => id !== svcId) : [...prev, svcId]
    );
  };

  const handleSubmit = async () => {
    if (!clientSearch.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    const allServiceIds = allowMultiService ? selectedServiceIds : (serviceId ? [serviceId] : []);
    if (allServiceIds.length === 0 || !date || !startTime) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      let finalClientId = clientId;

      // Create client if new
      if (!finalClientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            full_name: clientSearch.trim(),
            phone: clientPhone || null,
            email: clientEmail || null,
          })
          .select("id")
          .single();
        if (clientError) throw clientError;
        finalClientId = newClient.id;
      }

      let finalSpecialistId = specialistId === "auto" ? "" : specialistId;

      // Auto-assignment if no specialist selected
      if (!finalSpecialistId && filteredSpecialists && filteredSpecialists.length > 0) {
        const sorted = [...filteredSpecialists].sort((a, b) => {
          const aTime = (a as any).last_auto_assignment_at ?? "1970-01-01";
          const bTime = (b as any).last_auto_assignment_at ?? "1970-01-01";
          return aTime < bTime ? -1 : 1;
        });
        finalSpecialistId = sorted[0].user_id;

        await supabase
          .from("profiles")
          .update({ last_auto_assignment_at: new Date().toISOString() } as any)
          .eq("user_id", finalSpecialistId);
      }

      const startDateTime = withTimezoneOffset(`${date}T${startTime}:00`);
      let endDateTime = endTime ? withTimezoneOffset(`${date}T${endTime}:00`) : null;
      
      // Always compute end_time from service duration if not explicitly set
      if (!endDateTime && allServiceIds.length > 0) {
        const svc = services?.find((s) => s.id === allServiceIds[0]);
        const dur = svc?.duration_minutes ?? 30;
        const startDt = new Date(startDateTime);
        const endDt = new Date(startDt.getTime() + dur * 60000);
        endDateTime = endDt.toISOString();
      }

      const { data: apptData, error } = await supabase.from("appointments").insert({
        client_id: finalClientId,
        service_id: allServiceIds[0],
        specialist_id: finalSpecialistId || null,
        start_time: startDateTime,
        end_time: endDateTime,
        status: "agendado",
        notes: notes || null,
      } as any).select("id, cancellation_token").single();

      if (error) throw error;

      // Insert into appointment_services
      if (allServiceIds.length > 0 && apptData) {
        const rows = allServiceIds.map((svcId) => ({
          appointment_id: apptData.id,
          service_id: svcId,
        }));
        await supabase.from("appointment_services").insert(rows);
      }

      toast.success("Agendamento criado com sucesso!");

      // Always fire webhook — notify_client flag controls whether n8n sends the immediate alert
      // Reminder is always dispatched regardless
      const svc = services?.find((s) => s.id === allServiceIds[0]);
      fireBookingWebhook({
        event: "confirmed",
        appointment_id: apptData.id,
        cancellation_token: apptData.cancellation_token,
        notify_client: notifyClient,
        client: { full_name: clientSearch.trim(), phone: clientPhone || null, email: clientEmail || null },
        client_id: clientId || null,
        service_id: allServiceIds[0] || null,
        service_name: svc?.name ?? null,
        start_time: startDateTime,
        specialist_id: finalSpecialistId || null,
      });

      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const showClientDropdown = clients && clients.length > 0 && !clientId && clientSearch.length >= 2;
  const showNewClientOption = clientSearch.length >= 2 && !clientId && (!clients || clients.length === 0);

  // Selected service names for badges (multi-service mode)
  const selectedServiceNames = useMemo(() => {
    if (!services || !allowMultiService) return [];
    return selectedServiceIds.map((id) => {
      const svc = services.find((s) => s.id === id);
      return { id, name: svc?.name ?? "?" };
    });
  }, [services, selectedServiceIds, allowMultiService]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="sm:max-w-3xl p-0 gap-0 overflow-visible">
        <div className="overflow-hidden rounded-[inherit] bg-background">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
            {/* Left column — Appointment details */}
            <div className="p-6 space-y-5">
              <DialogHeader className="pb-0">
                <DialogTitle className="text-lg font-semibold tracking-wide">Nova Marcação</DialogTitle>
              </DialogHeader>

            {/* Date display */}
            <div>
              <p className="text-sm font-medium capitalize text-foreground">{dateDisplay}</p>
            </div>

            {/* Row 1: Horas + Minutos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Horas</Label>
                <Select value={startTime.split(":")[0] || ""} onValueChange={(v) => {
                  const mins = startTime.split(":")[1] || "00";
                  setStartTime(`${v}:${mins}`);
                }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
                      <SelectItem key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Minutos</Label>
                <Select value={startTime.split(":")[1] || ""} onValueChange={(v) => {
                  const hrs = startTime.split(":")[0] || "08";
                  setStartTime(`${hrs}:${v}`);
                }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Colaborador + Duração */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Colaborador</Label>
                {isSpecialist ? (
                  <Input
                    className="h-10"
                    value={specialists?.find((s) => s.user_id === user?.id)?.full_name || "—"}
                    readOnly
                    disabled
                  />
                ) : (
                  <Select value={specialistId} onValueChange={setSpecialistId}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Automático" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático (fila)</SelectItem>
                      {filteredSpecialists?.map((s) => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || "Sem nome"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Duração</Label>
                <Input value={endTime ? `${startTime} — ${endTime}` : ""} readOnly className="h-10 bg-muted/50" />
              </div>
            </div>

            {/* Row 3: Serviço (largura total) */}
            {!allowMultiService && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Serviço</Label>
                <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={servicePopoverOpen}
                      className="h-10 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {serviceId
                          ? services?.find((s) => s.id === serviceId)?.name ?? "Serviço"
                          : "Escolha um serviço"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    container={dialogContentRef.current}
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Pesquisar serviço..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                        {groupedServices.map((group) => (
                          <CommandGroup key={group.id ?? "_none"} heading={group.name}>
                            {group.services.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={s.name}
                                onSelect={() => {
                                  setServiceId(s.id);
                                  setServicePopoverOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", serviceId === s.id ? "opacity-100" : "opacity-0")} />
                                {s.name}
                                {s.duration_minutes && <span className="ml-auto text-xs text-muted-foreground">{s.duration_minutes}min</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Multi-service selector */}
            {allowMultiService && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Serviços</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Filtrar serviços..."
                    value={multiServiceFilter}
                    onChange={(e) => setMultiServiceFilter(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  {groupedServices.map((group) => {
                    const filtered = group.services.filter(s => s.name.toLowerCase().includes(multiServiceFilter.toLowerCase()));
                    if (filtered.length === 0) return null;
                    return (
                      <div key={group.id ?? "_none"}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 sticky top-0">{group.name}</div>
                        {filtered.map((s) => {
                          const isChecked = selectedServiceIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleMultiServiceToggle(s.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40 transition-colors border-t border-border",
                                isChecked && "bg-primary/5"
                              )}
                            >
                              <Checkbox checked={isChecked} className="pointer-events-none" />
                              <span className="flex-1">{s.name}</span>
                              {s.duration_minutes && <span className="text-xs text-muted-foreground">{s.duration_minutes}min</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                {selectedServiceNames.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedServiceNames.map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs gap-1">
                        {s.name}
                        <button type="button" onClick={() => handleMultiServiceToggle(s.id)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Right column — Client details */}
            <div className="p-6 space-y-4 border-l border-border bg-muted/20">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Cliente</h3>

            {/* Client search */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Nome do cliente"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setClientId(""); setIsNewClient(false); }}
                  className="pl-9 h-10"
                />
              </div>

              {/* Dropdown results */}
              {showClientDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-popover shadow-lg z-50 max-h-40 overflow-y-auto">
                  {clients.map((c: any) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                      onClick={() => selectClient(c)}
                    >
                      <span className="font-medium">{c.full_name}</span>
                      {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                    </button>
                  ))}
                  <button
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-primary border-t border-border"
                    onClick={handleCreateNewClient}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Criar "{clientSearch.trim()}"
                  </button>
                </div>
              )}

              {showNewClientOption && (
                <button
                  className="w-full text-left px-3 py-2.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2 text-primary mt-1"
                  onClick={handleCreateNewClient}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Criar cliente "{clientSearch.trim()}"
                </button>
              )}

              {isNewClient && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Novo cliente será criado
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <PhoneInput value={clientPhone} onChange={setClientPhone} placeholder="Telefone" defaultCountry={clinicCountry} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email do cliente"
                className="h-10"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações"
                rows={3}
                className="resize-none"
              />
            </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox checked={notifyClient} onCheckedChange={(v) => setNotifyClient(!!v)} />
              <span className="text-sm text-muted-foreground">Notificar cliente</span>
            </label>
            <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Marcar
            </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
