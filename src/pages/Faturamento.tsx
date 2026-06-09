import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BlurFade } from "@/components/ui/blur-fade";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { DateRangeFilter, type DateRangeValue } from "@/components/ui/date-range-filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import { fmtDateShort } from "@/lib/date";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
import FaturamentoKPIs from "@/components/faturamento/FaturamentoKPIs";
import FaturamentoFilters from "@/components/faturamento/FaturamentoFilters";
import MiniBarChart from "@/components/faturamento/MiniBarChart";

const PAGE_SIZE = 20;
const BILLING_APPOINTMENT_STATUSES = ["em_atendimento", "realizado", "concluido"] as const;

const PAYMENT_LABELS: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  realizado: "Realizado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const Faturamento = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [specialistFilter, setSpecialistFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Fetch specialists & services for filter dropdowns
  const { data: specialists } = useQuery({
    queryKey: ["faturamento-specialists"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "especialista");
      const specialistIds = (roles ?? []).map((r) => r.user_id);
      if (specialistIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", specialistIds).order("full_name");
      return (data ?? []).map((p) => ({ value: p.user_id, label: p.full_name }));
    },
  });

  const { data: services } = useQuery({
    queryKey: ["faturamento-services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name").eq("active", true).order("name");
      return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["faturamento", debouncedSearch, paymentFilter, specialistFilter, serviceFilter, dateRange, page],
    queryFn: async () => {
      // Step 1: Build the appointments query with server-side filters
      let query = supabase
        .from("appointments")
        .select(
          "id, start_time, status, client_id, specialist_id, service_id, session_number, clients!inner(full_name), services(name, price, multi_session, session_count)",
          { count: "exact" }
        )
        .in("status", BILLING_APPOINTMENT_STATUSES)
        .order("start_time", { ascending: false });

      if (dateRange) {
        query = query.gte("start_time", dateRange.from.toISOString()).lte("start_time", dateRange.to.toISOString());
      }

      // Apply search filter on client name (server-side)
      if (debouncedSearch.trim()) {
        query = query.ilike("clients.full_name", `%${debouncedSearch.trim()}%`);
      }

      if (specialistFilter !== "all") {
        query = query.eq("specialist_id", specialistFilter);
      }
      if (serviceFilter !== "all") {
        query = query.eq("service_id", serviceFilter);
      }

      // If payment filter is active, we need to filter via charges
      // First get all matching appointment IDs, then paginate
      let paymentFilteredIds: string[] | null = null;
      if (paymentFilter !== "all") {
        if (paymentFilter === "pendente") {
          // Pendente = appointments with no charge or charge with status pendente
          const { data: paidOrCancelledCharges } = await supabase
            .from("charges")
            .select("appointment_id")
            .in("status", ["pago", "cancelado"]);
          const excludeIds = new Set((paidOrCancelledCharges ?? []).map((c) => c.appointment_id).filter(Boolean));
          // We need to get all appointments and then exclude those with pago/cancelado charges
          // OR include those with pendente charges
          const { data: pendenteCharges } = await supabase
            .from("charges")
            .select("appointment_id")
            .eq("status", "pendente");
          const pendenteIds = new Set((pendenteCharges ?? []).map((c) => c.appointment_id).filter(Boolean));
          
          // Get all appointment ids that match other filters
          const { data: allAppts } = await supabase
            .from("appointments")
            .select("id, clients!inner(full_name)")
            .in("status", BILLING_APPOINTMENT_STATUSES)
            .then((res) => res);
          
          // Pendente = no charge at all OR has pendente charge
          paymentFilteredIds = (allAppts ?? [])
            .map((a: any) => a.id)
            .filter((id: string) => !excludeIds.has(id) || pendenteIds.has(id));
        } else {
          // pago or cancelado - get appointment_ids from charges
          const { data: filteredCharges } = await supabase
            .from("charges")
            .select("appointment_id")
            .eq("status", paymentFilter);
          paymentFilteredIds = (filteredCharges ?? []).map((c) => c.appointment_id).filter(Boolean) as string[];
        }

        if (paymentFilteredIds && paymentFilteredIds.length > 0) {
          query = query.in("id", paymentFilteredIds);
        } else if (paymentFilteredIds !== null) {
          // No matching appointments for this payment filter
          return {
            rows: [],
            total: 0,
            kpis: await fetchKPIs({ specialist: specialistFilter, service: serviceFilter, search: debouncedSearch }),
          };
        }
      }

      // Apply pagination
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data: appointments, error, count } = await query;
      if (error) throw error;

      // Fetch charges for these appointments
      const ids = (appointments ?? []).map((a: any) => a.id);
      let chargeMap: Record<string, { amount: number; status: string }> = {};
      if (ids.length > 0) {
        const { data: charges } = await supabase
          .from("charges")
          .select("appointment_id, amount, status")
          .in("appointment_id", ids);
        charges?.forEach((c) => {
          if (c.appointment_id) {
            if (chargeMap[c.appointment_id]) {
              chargeMap[c.appointment_id].amount += Number(c.amount);
            } else {
              chargeMap[c.appointment_id] = { amount: Number(c.amount), status: c.status };
            }
          }
        });
      }

      // Session numbers now come from the dedicated session_number column

      // Fetch client charge history for mini bar charts
      const clientIds = [...new Set((appointments ?? []).map((a: any) => a.client_id).filter(Boolean))];
      let clientChargeHistory: Record<string, number[]> = {};
      if (clientIds.length > 0) {
        const { data: historyCharges } = await supabase
          .from("charges")
          .select("client_id, amount, status")
          .in("client_id", clientIds)
          .eq("status", "pago")
          .order("created_at", { ascending: true })
          .limit(500);
        historyCharges?.forEach((c) => {
          if (!clientChargeHistory[c.client_id]) clientChargeHistory[c.client_id] = [];
          clientChargeHistory[c.client_id].push(Number(c.amount));
        });
      }

      // Fetch specialist names
      const specialistIds = [...new Set((appointments ?? []).map((a: any) => a.specialist_id).filter(Boolean))];
      let specialistMap: Record<string, string> = {};
      if (specialistIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", specialistIds);
        profiles?.forEach((p) => { specialistMap[p.user_id] = p.full_name; });
      }

      const rows = (appointments ?? []).map((a: any) => {
        const charge = chargeMap[a.id];
        const servicePrice = Number(a.services?.price ?? 0);
        const isMulti = a.services?.multi_session ?? false;
        const sessionNum = a.session_number ?? 1;
        const isSubsequentSession = isMulti && sessionNum > 1;

        // Determine display amount and payment status
        let displayAmount: number;
        let paymentStatus: string;

        if (charge) {
          displayAmount = charge.amount;
          paymentStatus = charge.status;
        } else if (isSubsequentSession) {
          // Subsequent session without charge — cost was in session #1
          displayAmount = 0;
          paymentStatus = "n/a";
        } else {
          displayAmount = servicePrice;
          paymentStatus = "pendente";
        }

        return {
          id: a.id,
          client_id: a.client_id,
          client_name: a.clients?.full_name ?? "—",
          service_name: a.services?.name ?? "—",
          specialist_name: a.specialist_id ? specialistMap[a.specialist_id] ?? "—" : "—",
          date: a.start_time,
          amount: displayAmount,
          payment_status: paymentStatus,
          appointment_status: a.status,
          chargeHistory: clientChargeHistory[a.client_id] ?? [],
        };
      });

      return {
        rows,
        total: count ?? 0,
        kpis: await fetchKPIs({ specialist: specialistFilter, service: serviceFilter, search: debouncedSearch }),
      };
    },
  });

  const fetchKPIs = async (filters: { specialist?: string; service?: string; search?: string }) => {
    let apptQuery = supabase
      .from("appointments")
      .select("id, client_id, service_id, session_number, start_time, created_at, clients!inner(full_name), services(price, multi_session)", { count: "exact" })
      .in("status", BILLING_APPOINTMENT_STATUSES);

    if (filters.specialist && filters.specialist !== "all") {
      apptQuery = apptQuery.eq("specialist_id", filters.specialist);
    }
    if (filters.service && filters.service !== "all") {
      apptQuery = apptQuery.eq("service_id", filters.service);
    }
    if (filters.search?.trim()) {
      apptQuery = apptQuery.ilike("clients.full_name", `%${filters.search.trim()}%`);
    }

    const { data: filteredAppts, count: countTotal } = await apptQuery;
    const apptIds = (filteredAppts ?? []).map((a: any) => a.id);

    // Determine which appointments are subsequent multi-session using session_number column
    const subsequentSessionIds = new Set<string>();
    (filteredAppts ?? []).forEach((a: any) => {
      const isMulti = (a.services as any)?.multi_session ?? false;
      if (isMulti && a.session_number != null && a.session_number > 1) {
        subsequentSessionIds.add(a.id);
      }
    });

    const apptServicePrice: Record<string, number> = {};
    const cancelledApptIds = new Set<string>();
    (filteredAppts ?? []).forEach((a: any) => {
      if (a.status === "cancelado") {
        cancelledApptIds.add(a.id);
      }
      apptServicePrice[a.id] = Number((a.services as any)?.price ?? 0);
    });

    let totalPago = 0, totalPendente = 0, totalCancelado = 0, countPago = 0, countPendente = 0;
    const chargedApptIds = new Set<string>();
    const cancelledChargeAmountByAppt = new Map<string, number>();

    if (apptIds.length > 0) {
      const { data: charges } = await supabase
        .from("charges")
        .select("appointment_id, amount, status")
        .in("appointment_id", apptIds);

      charges?.forEach((c) => {
        const amt = Number(c.amount);
        if (c.appointment_id) {
          chargedApptIds.add(c.appointment_id);

          if (cancelledApptIds.has(c.appointment_id)) {
            cancelledChargeAmountByAppt.set(
              c.appointment_id,
              (cancelledChargeAmountByAppt.get(c.appointment_id) ?? 0) + amt,
            );
          }
        }

        if (c.status === "pago") { totalPago += amt; countPago++; }
        else if (c.status === "pendente" && (!c.appointment_id || !cancelledApptIds.has(c.appointment_id))) {
          totalPendente += amt;
          countPendente++;
        }
      });
    }

    // Add fallback values for appointments without standalone charge value.
    apptIds.forEach((id) => {
      if (subsequentSessionIds.has(id)) {
        return;
      }

      if (cancelledApptIds.has(id)) {
        totalCancelado += cancelledChargeAmountByAppt.get(id) ?? apptServicePrice[id] ?? 0;
        return;
      }

      if (!chargedApptIds.has(id)) {
        totalPendente += apptServicePrice[id] ?? 0;
        countPendente++;
      }
    });

    return { totalPago, totalPendente, totalCancelado, countPago, countPendente, countTotal: countTotal ?? 0 };
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const resetPage = () => setPage(1);

  const getPaymentBadge = (status: string) => <StatusBadge status={status} />;
  const getStatusBadge = (status: string) => <StatusBadge status={status} />;

  const getBarColor = (status: string) =>
    status === "pago" ? "hsl(150 25% 45%)" : status === "cancelado" ? "hsl(0 45% 55%)" : "hsl(30 20% 55%)";

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <PageHeader icon={<DollarSign className="w-5 h-5" />} title="Faturamento" subtitle="Visão financeira dos atendimentos realizados" className="mb-0" />
          </div>
        </div>
      </BlurFade>

      {data?.kpis && (
        <BlurFade delay={0.1}>
          <FaturamentoKPIs {...data.kpis} />
        </BlurFade>
      )}

      <div className="mb-4">
        <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); resetPage(); }} />
      </div>
      <FaturamentoFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); resetPage(); }}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(v) => { setPaymentFilter(v); resetPage(); }}
        specialistFilter={specialistFilter}
        onSpecialistFilterChange={(v) => { setSpecialistFilter(v); resetPage(); }}
        serviceFilter={serviceFilter}
        onServiceFilterChange={(v) => { setServiceFilter(v); resetPage(); }}
        specialists={specialists ?? []}
        services={services ?? []}
      />

      <BlurFade delay={0.15}>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Paciente</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Procedimento</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Especialista</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Pagamento</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Histórico</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.rows && data.rows.length > 0 ? (
                data.rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/atendimentos/${row.id}`)}
                  >
                    <TableCell className="font-medium">
                      <button
                        className="hover:underline text-left text-primary/80 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${row.client_id}`); }}
                      >
                        {row.client_name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.service_name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.specialist_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmtDateShort(row.date)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmtCurrency(row.amount)}
                    </TableCell>
                    <TableCell>{row.payment_status === "n/a" ? <span className="text-xs text-muted-foreground">—</span> : getPaymentBadge(row.payment_status)}</TableCell>
                    <TableCell>
                      <MiniBarChart
                        values={row.chargeHistory}
                        color={getBarColor(row.payment_status)}
                      />
                    </TableCell>
                    <TableCell>{getStatusBadge(row.appointment_status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhum atendimento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </BlurFade>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faturamento;
