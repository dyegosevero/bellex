import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  channel: string;
  audienceFilter: string;
  includeNoOptin: boolean;
  onChangeFilter: (f: string) => void;
  onChangeOptin: (v: boolean) => void;
}

const channelContactField: Record<string, string> = {
  email: "email",
  sms: "phone",
  whatsapp: "phone",
};

// audienceFilter encoding:
//   "all" | "new" | "active" | "inactive"
//   "by_service:id1,id2,..."
//   "individual:id1,id2,..."

function parseFilter(f: string): { mode: string; ids: string[] } {
  const idx = f.indexOf(":");
  if (idx === -1) return { mode: f, ids: [] };
  return { mode: f.slice(0, idx), ids: f.slice(idx + 1).split(",").filter(Boolean) };
}

function encodeFilter(mode: string, ids: string[]): string {
  if (ids.length === 0) return mode;
  return `${mode}:${ids.join(",")}`;
}

interface AudienceClient {
  id: string;
  opt_in: boolean;
  phone?: string | null;
  email?: string | null;
}

interface AudienceAppointment {
  client_id: string;
  start_time: string;
}

export default function CampaignAudienceTab({
  channel,
  audienceFilter,
  includeNoOptin,
  onChangeFilter,
  onChangeOptin,
}: Props) {
  const contactField = channelContactField[channel] || "email";
  const isEmailChannel = contactField === "email";

  const { mode, ids: selectedIds } = parseFilter(audienceFilter);

  const [serviceSearch, setServiceSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // ── Services ──────────────────────────────────────────────────────────────
  const { data: services } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const filteredServices = useMemo(
    () => (services ?? []).filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase())),
    [services, serviceSearch],
  );

  const toggleService = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChangeFilter(encodeFilter("by_service", next));
  };

  // ── Clients (for individual selection) ────────────────────────────────────
  const { data: allClients } = useQuery({
    queryKey: ["all-clients-marketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, full_name, phone, email, opt_in")
        .order("full_name");
      return data ?? [];
    },
    enabled: mode === "individual",
  });

  const filteredClients = useMemo(() => {
    if (!allClients) return [];
    const q = clientSearch.toLowerCase();
    return allClients.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [allClients, clientSearch]);

  const toggleClient = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChangeFilter(encodeFilter("individual", next));
  };

  // ── Audience counts ────────────────────────────────────────────────────────
  const { data: counts } = useQuery({
    queryKey: ["campaign-audience-detail", channel, includeNoOptin],
    queryFn: async () => {
      let allClientsData: AudienceClient[] = [];
      let offset = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const query = isEmailChannel
          ? supabase.from("clients").select("id, opt_in, email").not("email", "is", null).neq("email", "")
          : supabase.from("clients").select("id, opt_in, phone").not("phone", "is", null).neq("phone", "");

        const { data: page } = await query.range(offset, offset + PAGE_SIZE - 1);
        if (!page || page.length === 0) break;
        allClientsData = allClientsData.concat(page as AudienceClient[]);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      const filtered = includeNoOptin ? allClientsData : allClientsData.filter((c) => c.opt_in);
      const clientIds = filtered.map((c) => c.id);

      if (clientIds.length === 0) return { all: 0, new: 0, active: 0, inactive: 0 };

      let allAppointments: AudienceAppointment[] = [];
      for (let i = 0; i < clientIds.length; i += 500) {
        const batch = clientIds.slice(i, i + 500);
        const { data: appointments } = await supabase
          .from("appointments")
          .select("client_id, start_time")
          .in("client_id", batch);
        if (appointments) allAppointments = allAppointments.concat(appointments as AudienceAppointment[]);
      }

      const appByClient: Record<string, string[]> = {};
      allAppointments.forEach((a) => {
        if (!appByClient[a.client_id]) appByClient[a.client_id] = [];
        appByClient[a.client_id].push(a.start_time);
      });

      let newCount = 0;
      let activeCount = 0;
      let inactiveCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);

      filtered.forEach((c) => {
        const appts = appByClient[c.id] || [];
        if (appts.length === 0) { inactiveCount++; return; }
        const sorted = appts.sort();
        const firstVisit = new Date(sorted[0]);
        const lastVisit = new Date(sorted[sorted.length - 1]);
        if (firstVisit >= cutoffDate) newCount++;
        if (lastVisit >= cutoffDate) activeCount++;
        else inactiveCount++;
      });

      return { all: filtered.length, new: newCount, active: activeCount, inactive: inactiveCount };
    },
  });

  const serviceNames = useMemo(() => {
    if (!services || mode !== "by_service") return [];
    return selectedIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean) as string[];
  }, [services, selectedIds, mode]);

  const clientNames = useMemo(() => {
    if (!allClients || mode !== "individual") return [];
    return selectedIds.map((id) => allClients.find((c) => c.id === id)?.full_name).filter(Boolean) as string[];
  }, [allClients, selectedIds, mode]);

  const segments = [
    { value: "all", label: `Todos os clientes (${counts?.all ?? "..."})`, desc: "Toda a lista de clientes" },
    { value: "new", label: `Novos clientes (${counts?.new ?? "..."})`, desc: "Primeira marcação nos últimos 30 dias" },
    { value: "active", label: `Clientes ativos (${counts?.active ?? "..."})`, desc: "Com marcações nos últimos 30 dias" },
    { value: "inactive", label: `Clientes inativos (${counts?.inactive ?? "..."})`, desc: "Sem marcações nos últimos 30 dias" },
    { value: "by_service", label: "Por serviço realizado", desc: "Todos que já fizeram um ou mais serviços específicos" },
    { value: "individual", label: "Clientes individuais", desc: "Selecione clientes específicos pelo nome" },
  ];

  return (
    <div className="space-y-4">
      {/* Opt-in warning */}
      <div className="rounded-lg bg-accent border border-border px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-foreground">
          <p>Apenas os clientes que aceitam receber campanhas de marketing são mostrados nesta lista.</p>
          <div className="flex items-center gap-2 mt-2">
            <Switch checked={includeNoOptin} onCheckedChange={onChangeOptin} className="scale-90" />
            <span className="text-xs">Incluir clientes sem consentimento de marketing</span>
          </div>
        </div>
      </div>

      {/* Audience segments */}
      <RadioGroup
        value={mode}
        onValueChange={(v) => onChangeFilter(v)}
        className="space-y-2"
      >
        {segments.map((seg) => (
          <label
            key={seg.value}
            className={`flex flex-col gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              mode === seg.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value={seg.value} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{seg.label}</p>
                <p className="text-xs text-muted-foreground">{seg.desc}</p>
              </div>
            </div>

            {/* ── By service: multiselect with checkboxes ── */}
            {seg.value === "by_service" && mode === "by_service" && (
              <div className="pl-7 space-y-2" onClick={(e) => e.stopPropagation()}>
                {/* Selected badges */}
                {serviceNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {serviceNames.map((name, i) => (
                      <Badge
                        key={selectedIds[i]}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs cursor-pointer"
                        onClick={() => toggleService(selectedIds[i])}
                      >
                        {name}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar serviço..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {/* Checkboxes */}
                <ScrollArea className="h-40 rounded border border-border bg-background">
                  <div className="p-2 space-y-1">
                    {filteredServices.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum serviço encontrado</p>
                    ) : (
                      filteredServices.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedIds.includes(s.id)}
                            onCheckedChange={() => toggleService(s.id)}
                          />
                          <span className="text-sm">{s.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {selectedIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedIds.length} serviço{selectedIds.length !== 1 ? "s" : ""} selecionado{selectedIds.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* ── Individual clients: search + checkboxes ── */}
            {seg.value === "individual" && mode === "individual" && (
              <div className="pl-7 space-y-2" onClick={(e) => e.stopPropagation()}>
                {/* Selected badges */}
                {clientNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {clientNames.map((name, i) => (
                      <Badge
                        key={selectedIds[i]}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs cursor-pointer"
                        onClick={() => toggleClient(selectedIds[i])}
                      >
                        {name}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou e-mail..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {/* Checkboxes */}
                <ScrollArea className="h-48 rounded border border-border bg-background">
                  <div className="p-2 space-y-1">
                    {!allClients ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Carregando...</p>
                    ) : filteredClients.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum cliente encontrado</p>
                    ) : (
                      filteredClients.slice(0, 100).map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedIds.includes(c.id)}
                            onCheckedChange={() => toggleClient(c.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{c.full_name}</p>
                            {(c.phone || c.email) && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {c.phone || c.email}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {selectedIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedIds.length} cliente{selectedIds.length !== 1 ? "s" : ""} selecionado{selectedIds.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
