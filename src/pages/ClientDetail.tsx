import { useState, useCallback, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInYears, parse } from "date-fns";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Edit, User, Calendar, ShoppingBag, Clock, FileText,
  ExternalLink, Image as ImageIcon, AlertTriangle, Plus, ClipboardList,
  Smile, PersonStanding, Star, History, Pencil, Save, X, Eye, Trash2,
  Shield, ShieldOff, Loader2, FileSignature, CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClientTimeline } from "@/components/clients/ClientTimeline";
import ConsentViewDialog from "@/components/appointment-session/ConsentViewDialog";
import CompletionViewDialog from "@/components/appointment-session/CompletionViewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, fmtDateTime, fmtCurrency, fmtDateShort } from "@/lib/date";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const SignedClientImage = ({ fileUrl, caption }: { fileUrl: string; caption?: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    storage.from("client-images").createSignedUrl(fileUrl, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [fileUrl]);
  if (!url) return <div className="aspect-square rounded-lg border border-border bg-muted animate-pulse" />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
      <img src={url} alt={caption || ""} className="w-full h-full object-cover" />
    </a>
  );
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { canEditClinical, role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch client consent types
  const { data: clientConsentTypes } = useQuery({
    queryKey: ["client-consent-types", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_consents")
        .select("consent_type")
        .eq("client_id", id!)
        .eq("is_valid", true);
      const types = new Set((data ?? []).map((c: any) => c.consent_type));
      return {
        hasSocial: types.has("treatment_social"),
        hasInternal: types.has("treatment_internal"),
        hasAny: types.size > 0,
      };
    },
    enabled: !!id,
  });

  const { data: appointments } = useQuery({
    queryKey: ["client-appointments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, multi_session, session_count), specialist_id")
        .eq("client_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: charges } = useQuery({
    queryKey: ["client-charges", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("charges").select("*").eq("client_id", id!).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch specialist names for appointments
  const specialistIds = [...new Set((appointments ?? []).map((a: any) => a.specialist_id).filter(Boolean))];
  const { data: specialists } = useQuery({
    queryKey: ["specialists-for-client", specialistIds],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", specialistIds);
      const map: Record<string, string> = {};
      data?.forEach((p) => { map[p.user_id] = p.full_name; });
      return map;
    },
    enabled: specialistIds.length > 0,
  });

  // Fetch products used in appointments
  const appointmentIds = (appointments ?? []).map((a: any) => a.id);
  const { data: appointmentProductsRaw } = useQuery({
    queryKey: ["client-appointment-products", appointmentIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointment_products")
        .select("appointment_id, quantity, unit_price, products(name)")
        .in("appointment_id", appointmentIds);
      return data ?? [];
    },
    enabled: appointmentIds.length > 0,
  });

  // Build maps: names list + total product value per appointment
  const appointmentProducts: Record<string, string[]> = {};
  const appointmentProductValues: Record<string, number> = {};
  (appointmentProductsRaw ?? []).forEach((ap: any) => {
    const aid = ap.appointment_id;
    if (!appointmentProducts[aid]) { appointmentProducts[aid] = []; appointmentProductValues[aid] = 0; }
    appointmentProducts[aid].push(ap.products?.name ?? "Produto");
    appointmentProductValues[aid] += (ap.unit_price ?? 0) * (ap.quantity ?? 1);
  });

  // Fetch feedback for appointments
  const { data: feedbackMap } = useQuery({
    queryKey: ["client-feedback", appointmentIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointment_feedback")
        .select("appointment_id, rating, comment")
        .in("appointment_id", appointmentIds);
      const map: Record<string, { rating: number; comment: string | null }> = {};
      data?.forEach((f: any) => { map[f.appointment_id] = { rating: f.rating, comment: f.comment }; });
      return map;
    },
    enabled: appointmentIds.length > 0,
  });

  // Fetch anamnesis records for the client
  const { data: anamnesisRecords } = useQuery({
    queryKey: ["client-anamnesis-list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_anamnesis")
        .select("id, appointment_id, form_type, created_at")
        .eq("client_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Build charge map by appointment
  const chargeMap: Record<string, { amount: number; status: string }> = {};
  charges?.forEach((c) => {
    if (c.appointment_id) {
      if (chargeMap[c.appointment_id]) {
        chargeMap[c.appointment_id].amount += Number(c.amount);
      } else {
        chargeMap[c.appointment_id] = { amount: Number(c.amount), status: c.status };
      }
    }
  });

  // Session numbers from dedicated column
  const sessionNumberMap = useMemo(() => {
    if (!appointments) return {};
    const map: Record<string, number | null> = {};
    appointments.forEach((a: any) => {
      if (a.session_number != null) {
        map[a.id] = a.session_number;
      }
    });
    return map;
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado.</div>;
  }

  const consentPdfPublicUrl = client.consent_pdf_url
    ? storage.from("consent-pdfs").getPublicUrl(client.consent_pdf_url).data.publicUrl
    : null;

  const totalInvested = charges?.filter((c) => c.status === "pago").reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const totalProductsValue = Object.values(appointmentProductValues).reduce((sum, v) => sum + v, 0);
  const totalServicesValue = totalInvested - totalProductsValue;
  const totalAppointments = appointments?.length ?? 0;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const isActive = appointments?.some((a: any) => new Date(a.start_time) >= threeMonthsAgo);
  const nextAppointment = appointments?.find((a: any) => new Date(a.start_time) > new Date() && a.status !== "cancelado");
  const clientSince = format(new Date(client.created_at), "MMM/yyyy", { locale: pt });

  const getPaymentBadge = (status: string) => <StatusBadge status={status} />;
  const getStatusBadge = (status: string) => <StatusBadge status={status} />;

  return (
    <div>
      {/* Back button */}
      <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")} className="mb-4">
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Left: Avatar + Name + Badges */}
          <div className="flex items-center gap-4 flex-shrink-0 min-w-0 lg:max-w-[40%]">
            <Avatar className="h-14 w-14 border border-border shrink-0">
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-2xl font-light tracking-wider uppercase truncate">{client.full_name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Desde {clientSince}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isActive ? (
                  <span className="inline-flex items-center rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2.5 py-0.5 text-[10px] font-semibold">Ativo</span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-2.5 py-0.5 text-[10px] font-semibold">Inativo</span>
                )}
                {role === "admin" && totalInvested >= 5000 && (
                  <span className="inline-flex items-center rounded-full border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] px-2.5 py-0.5 text-[10px] font-semibold">VIP</span>
                )}
                {client.opt_in && (
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-semibold">Marketing</span>
                )}
                {clientConsentTypes?.hasSocial && (
                  <span className="inline-flex items-center rounded-full border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2.5 py-0.5 text-[10px] font-semibold">Consentimento Público</span>
                )}
                {clientConsentTypes?.hasInternal && !clientConsentTypes?.hasSocial && (
                  <span className="inline-flex items-center rounded-full border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] px-2.5 py-0.5 text-[10px] font-semibold">Consentimento Privado</span>
                )}
                {!clientConsentTypes?.hasAny && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> Sem consentimento
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: KPI square cards */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {role === "admin" && (
              <>
                <div className="bg-muted/40 border border-border rounded-lg w-[130px] h-[80px] flex flex-col justify-center px-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Gasto</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{fmtCurrency(totalInvested)}</p>
                </div>
                <div className="bg-muted/40 border border-border rounded-lg w-[130px] h-[80px] flex flex-col justify-center px-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Serviços</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{fmtCurrency(totalServicesValue > 0 ? totalServicesValue : 0)}</p>
                </div>
                <div className="bg-muted/40 border border-border rounded-lg w-[130px] h-[80px] flex flex-col justify-center px-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Produtos</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{fmtCurrency(totalProductsValue)}</p>
                </div>
                <div className="bg-muted/40 border border-border rounded-lg w-[130px] h-[80px] flex flex-col justify-center px-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">
                    {totalAppointments > 0 ? fmtCurrency(totalInvested / totalAppointments) : "—"}
                  </p>
                </div>
              </>
            )}
            <div className="bg-muted/40 border border-border rounded-lg w-[130px] h-[80px] flex flex-col justify-center px-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Procedimentos</p>
              <p className="text-lg font-semibold text-foreground mt-0.5">{totalAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for other details */}
      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dados" className="gap-1.5"><User className="w-3.5 h-3.5" /> Dados</TabsTrigger>
          {role === "admin" && <TabsTrigger value="historico" className="gap-1.5"><History className="w-3.5 h-3.5" /> Histórico</TabsTrigger>}
          {role !== "atendimento" && <TabsTrigger value="fichas" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Fichas</TabsTrigger>}
          <TabsTrigger value="compras" className="gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Compras</TabsTrigger>
          {role === "admin" && <TabsTrigger value="cobrancas" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Cobranças</TabsTrigger>}
          <TabsTrigger value="timeline" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
          {role !== "atendimento" && <TabsTrigger value="documentos" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Documentos</TabsTrigger>}
          {role !== "atendimento" && <TabsTrigger value="imagens" className="gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Imagens</TabsTrigger>}
        </TabsList>

        <TabsContent value="dados">
          <ClientDadosTab
            client={client}
            canEditClinical={canEditClinical}
            consentPdfPublicUrl={consentPdfPublicUrl}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editData={editData}
            setEditData={setEditData}
            saving={saving}
            setSaving={setSaving}
            clientId={id!}
            queryClient={queryClient}
          />
        </TabsContent>

        {role === "admin" && (
        <TabsContent value="historico">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Histórico</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Criado em</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Dia e Hora</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Procedimento</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Valor Serviço</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Especialista</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Produtos</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Valor Produtos</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Total</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Pgto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Feedback</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments && appointments.length > 0 ? (
                  appointments.map((a: any) => {
                    const charge = chargeMap[a.id];
                    const products = appointmentProducts?.[a.id];
                    const fb = feedbackMap?.[a.id];
                    return (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/atendimentos/${a.id}`)}
                      >
                        {(() => {
                          const prodVal = appointmentProductValues[a.id] ?? 0;
                          const totalVal = charge ? charge.amount : 0;
                          const serviceVal = totalVal - prodVal;
                          return (
                            <>
                              <TableCell className="text-muted-foreground text-sm">{fmtDateShort(a.created_at)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{fmtDateTime(a.start_time)}</TableCell>
                              <TableCell className="font-medium">
                                {a.services?.name ?? "—"}
                                {sessionNumberMap[a.id] != null && (
                                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                    #{sessionNumberMap[a.id]} de {(a.services as any)?.session_count}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {charge ? fmtCurrency(serviceVal > 0 ? serviceVal : totalVal) : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{a.specialist_id && specialists ? specialists[a.specialist_id] ?? "—" : "—"}</TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                                {products && products.length > 0 ? products.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {prodVal > 0 ? fmtCurrency(prodVal) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {charge ? fmtCurrency(totalVal) : "—"}
                              </TableCell>
                              <TableCell>{charge ? getPaymentBadge(charge.status) : "—"}</TableCell>
                              <TableCell>
                                {fb ? (
                                  <span className="inline-flex items-center gap-1 text-sm">
                                    <Star className="w-3.5 h-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                                    <span className="font-semibold">{fb.rating}</span>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(a.status)}</TableCell>
                            </>
                          );
                        })()}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                      Nenhum procedimento registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        )}

        {role !== "atendimento" && (
        <TabsContent value="fichas">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Fichas Clínicas</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anamnesisRecords && anamnesisRecords.length > 0 ? (
                  anamnesisRecords.map((rec) => {
                    const appt = appointments?.find((a: any) => a.id === rec.appointment_id);
                    const formTypeLabel = rec.form_type === "face" ? "Rosto" : rec.form_type === "body" ? "Corpo" : rec.form_type;
                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="text-muted-foreground text-sm">{fmtDateShort(rec.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{formTypeLabel}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{appt?.services?.name ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => navigate(`/atendimentos/${rec.appointment_id}/sessao`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={async () => {
                                if (!confirm("Tem certeza que deseja apagar esta ficha?")) return;
                                const { error } = await supabase.from("appointment_anamnesis").delete().eq("id", rec.id);
                                if (error) { toast.error("Erro ao apagar ficha."); return; }
                                toast.success("Ficha apagada.");
                                queryClient.invalidateQueries({ queryKey: ["client-anamnesis-list", id] });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Nenhuma ficha registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        )}

        <TabsContent value="compras">
          <ClientPurchasesTab clientId={id!} appointmentProducts={appointmentProducts} appointments={appointments} />
        </TabsContent>

        {role === "admin" && (
        <TabsContent value="cobrancas">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Cobranças</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Atendimento</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Pgto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges && charges.length > 0 ? (
                  charges.map((c: any) => {
                    const relatedAppt = appointments?.find((a: any) => a.id === c.appointment_id);
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/cobrancas/${c.id}`)}
                      >
                        <TableCell className="text-muted-foreground text-sm">{fmtDateShort(c.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {relatedAppt ? (relatedAppt.services?.name ?? "—") : "Sem atendimento"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmtCurrency(c.amount)}</TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.paid_at ? fmtDateShort(c.paid_at) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Nenhuma cobrança registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        )}

        <TabsContent value="timeline">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Timeline</h2>
          <ClientTimeline clientId={id!} />
        </TabsContent>

        {role !== "atendimento" && <TabsContent value="documentos"><ClientDocumentsTab clientId={id!} consentPdfUrl={consentPdfPublicUrl} /></TabsContent>}
        {role !== "atendimento" && <TabsContent value="imagens"><ClientImagesTab clientId={id!} /></TabsContent>}
      </Tabs>
    </div>
  );
};

const ClientPurchasesTab = ({ clientId, appointmentProducts, appointments }: {
  clientId: string;
  appointmentProducts?: Record<string, string[]>;
  appointments?: any[];
}) => {
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ["client-all-products", clientId],
    queryFn: async () => {
      const apptIds = (appointments ?? []).map((a: any) => a.id);
      if (apptIds.length === 0) return [];
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name, image_url), appointments!inner(start_time, services(name))")
        .in("appointment_id", apptIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: (appointments ?? []).length > 0,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Compras</h2>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs uppercase tracking-wider">Produto</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Qtd</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allProducts && allProducts.length > 0 ? (
            allProducts.map((ap: any) => (
              <TableRow key={ap.id}>
                <TableCell className="font-medium">{ap.products?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{fmtDateShort(ap.appointments?.start_time)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{ap.appointments?.services?.name ?? "—"}</TableCell>
                <TableCell>{ap.quantity}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtCurrency(ap.unit_price * ap.quantity)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                Nenhum produto comprado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
const ClientDocumentsTab = ({ clientId, consentPdfUrl }: { clientId: string; consentPdfUrl: string | null }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [viewConsent, setViewConsent] = useState<any | null>(null);
  const [viewCompletionDoc, setViewCompletionDoc] = useState<any | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [revokeConsent, setRevokeConsent] = useState<any | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [deleteConsent, setDeleteConsent] = useState<any | null>(null);
  const [deletingConsent, setDeletingConsent] = useState(false);

  const { data: consents, isLoading: consentsLoading } = useQuery({
    queryKey: ["client-consents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_consents")
        .select("*, appointments!client_consents_appointment_id_fkey(service_id, services!appointments_service_id_fkey(name))")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const consentTypeLabel = (type: string) => {
    if (type === "treatment_social") return "Tratamento + Redes Sociais";
    if (type === "treatment_internal") return "Tratamento + Análise Interna";
    return type;
  };

  const getPublicUrl = (path: string) =>
    storage.from("client-documents").getPublicUrl(path).data.publicUrl;

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      await storage.from("client-documents").remove([deleteDoc.file_url]);
      const { error } = await supabase.from("client_documents").delete().eq("id", deleteDoc.id);
      if (error) { toast.error("Erro ao apagar."); return; }
      toast.success("Documento apagado.");
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
    } finally {
      setDeleting(false);
      setDeleteDoc(null);
    }
  };

  const handleRevokeConsent = async () => {
    if (!revokeConsent) return;
    setRevoking(true);
    try {
      const { error } = await supabase
        .from("client_consents")
        .update({ is_valid: false })
        .eq("id", revokeConsent.id);
      if (error) { toast.error("Erro ao revogar consentimento."); return; }
      toast.success("Consentimento revogado.");
      queryClient.invalidateQueries({ queryKey: ["client-consents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-consent-types", clientId] });
    } finally {
      setRevoking(false);
      setRevokeConsent(null);
    }
  };

  const handleDeleteConsent = async () => {
    if (!deleteConsent) return;
    setDeletingConsent(true);
    try {
      // Remove signature file if exists
      if (deleteConsent.signature_url) {
        await storage.from("consent-signatures").remove([deleteConsent.signature_url]);
      }
      const { error } = await supabase.from("client_consents").delete().eq("id", deleteConsent.id);
      if (error) { toast.error("Erro ao excluir consentimento."); return; }
      toast.success("Consentimento excluído.");
      queryClient.invalidateQueries({ queryKey: ["client-consents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-consent-types", clientId] });
    } finally {
      setDeletingConsent(false);
      setDeleteConsent(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider">Documentos</h2>
      {consentPdfUrl && (
        <div className="bg-card border border-border rounded-lg p-4">
          <a href={consentPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <FileText className="w-4 h-4" /> PDF de Consentimento Assinado <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Consents list */}
      {consentsLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : consents && consents.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Consentimentos
          </h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Estado</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">
                      {c.appointments?.services?.name || <span className="text-muted-foreground italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{consentTypeLabel(c.consent_type)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.signed_at ? format(new Date(c.signed_at), "dd MMM yyyy", { locale: pt }) : "—"}
                    </TableCell>
                    <TableCell>
                      {c.is_valid ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Revogado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.appointment_id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver sessão" onClick={() => navigate(`/atendimentos/${c.appointment_id}/sessao`)}>
                            <Calendar className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver documento" onClick={() => setViewConsent(c)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {c.is_valid && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" title="Revogar" onClick={() => setRevokeConsent(c)}>
                            <ShieldOff className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Excluir" onClick={() => setDeleteConsent(c)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {/* Files / Documents table */}
      {docsLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : documents && documents.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentos
          </h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Tipo</TableHead>
                  
                  <TableHead className="text-xs uppercase tracking-wider w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => {
                  const docTypeConfig: Record<string, { label: string; cls: string }> = {
                    completion_signature: { label: "Presença", cls: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
                    consent: { label: "Consentimento", cls: "bg-primary/10 text-primary border-primary/30" },
                    upload: { label: "Upload", cls: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" },
                  };
                  const typeInfo = docTypeConfig[doc.document_type] ?? { label: doc.document_type, cls: "bg-muted text-muted-foreground border-border" };
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="text-muted-foreground text-sm">{fmtDateShort(doc.created_at)}</TableCell>
                      <TableCell className="font-medium text-sm">{doc.file_name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${typeInfo.cls}`}>
                          {typeInfo.label}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {doc.appointment_id && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver sessão" onClick={() => navigate(`/atendimentos/${doc.appointment_id}/sessao`)}>
                              <Calendar className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {doc.document_type === "completion_signature" ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCompletionDoc(doc)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={getPublicUrl(doc.file_url)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteDoc(doc)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {!consents?.length && !documents?.length && !consentPdfUrl && (
        <p className="text-center py-8 text-muted-foreground text-sm">Nenhum documento ou consentimento registrado.</p>
      )}

      {viewConsent && (
        <ConsentViewDialog
          open={!!viewConsent}
          onOpenChange={(open) => !open && setViewConsent(null)}
          consent={viewConsent}
        />
      )}

      {viewCompletionDoc && (
        <CompletionViewDialog
          open={!!viewCompletionDoc}
          onOpenChange={(open) => !open && setViewCompletionDoc(null)}
          document={viewCompletionDoc}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar documento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja apagar <strong>{deleteDoc?.file_name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteDoc(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Apagando…" : "Apagar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke consent confirmation */}
      <Dialog open={!!revokeConsent} onOpenChange={(open) => !open && setRevokeConsent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revogar consentimento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja revogar o consentimento <strong>{revokeConsent && consentTypeLabel(revokeConsent.consent_type)}</strong>? O documento será mantido mas marcado como inválido.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setRevokeConsent(null)}>Cancelar</Button>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleRevokeConsent} disabled={revoking}>
              {revoking ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Revogando…</> : "Revogar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete consent confirmation */}
      <Dialog open={!!deleteConsent} onOpenChange={(open) => !open && setDeleteConsent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir consentimento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir permanentemente o consentimento <strong>{deleteConsent && consentTypeLabel(deleteConsent.consent_type)}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConsent(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConsent} disabled={deletingConsent}>
              {deletingConsent ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Excluindo…</> : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ClientImagesTab = ({ clientId }: { clientId: string }) => {
  const navigate = useNavigate();
  const [viewConsentOpen, setViewConsentOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<any>(null);

  // Fetch consents for this client
  const { data: consents } = useQuery({
    queryKey: ["client-consents-images", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_consents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch images grouped with appointment info
  const { data: images, isLoading } = useQuery({
    queryKey: ["client-images", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_images")
        .select("*, appointments(id, start_time, service_id, specialist_id)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch services and specialists for labels
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name");
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (!images || images.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Imagens</h2>
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm">Nenhuma imagem registrada.</p>
        </div>
      </div>
    );
  }

  // Group images by appointment_id
  const grouped = images.reduce((acc: Record<string, any[]>, img: any) => {
    const key = img.appointment_id ?? "sem-atendimento";
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {});

  const getServiceName = (serviceId: string | null) => services?.find((s) => s.id === serviceId)?.name ?? "—";
  const getSpecialistName = (specialistId: string | null) => profiles?.find((p) => p.user_id === specialistId)?.full_name ?? "—";

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Imagens</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(grouped).map(([apptId, imgs]: [string, any[]]) => {
        const appt = (imgs[0] as any)?.appointments;
        const refCode = apptId !== "sem-atendimento" ? apptId.slice(0, 8).toUpperCase() : null;

        return (
          <div key={apptId} className="bg-card border border-border rounded-lg p-3 space-y-2">
            {/* Header with appointment info */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                {refCode && (
                  <button
                    onClick={() => navigate(`/atendimentos/${apptId}`)}
                    className="text-xs font-mono text-primary hover:underline"
                  >
                    #{refCode}
                  </button>
                )}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                  {appt?.start_time && <span>{fmtDate(appt.start_time)}</span>}
                  {appt?.service_id && <span>· {getServiceName(appt.service_id)}</span>}
                  {appt?.specialist_id && <span>· {getSpecialistName(appt.specialist_id)}</span>}
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">{imgs.length} foto{imgs.length > 1 ? "s" : ""}</Badge>
            </div>

            {/* Image thumbnails - 2 per row inside card */}
            <div className="grid grid-cols-2 gap-2">
              {imgs.map((img: any) => (
                <SignedClientImage key={img.id} fileUrl={img.file_url} caption={img.caption} />
              ))}
            </div>

            {/* Consent link */}
            {apptId !== "sem-atendimento" && (() => {
              const consent = consents?.find((c: any) => c.appointment_id === apptId && c.is_valid);
              return consent ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs mt-1"
                  onClick={() => { setSelectedConsent(consent); setViewConsentOpen(true); }}
                >
                  <FileSignature className="w-3.5 h-3.5" /> Ver Consentimento
                </Button>
              ) : null;
            })()}
          </div>
        );
      })}

      {selectedConsent && (
        <ConsentViewDialog
          open={viewConsentOpen}
          onOpenChange={setViewConsentOpen}
          consent={selectedConsent}
        />
      )}
      </div>
    </div>
  );
};

const ClientDadosTab = ({
  client, canEditClinical, consentPdfPublicUrl, isEditing, setIsEditing,
  editData, setEditData, saving, setSaving, clientId, queryClient,
}: {
  client: any; canEditClinical: boolean; consentPdfPublicUrl: string | null;
  isEditing: boolean; setIsEditing: (v: boolean) => void;
  editData: Record<string, string>; setEditData: (v: Record<string, string>) => void;
  saving: boolean; setSaving: (v: boolean) => void;
  clientId: string; queryClient: any;
}) => {
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edit data on mount / client change
  const getEditFields = useCallback(() => ({
    full_name: client.full_name ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    cpf: client.cpf ?? "",
    citizen_card_number: client.citizen_card_number ?? "",
    profession: (client as any).profession ?? "",
    birth_date: client.birth_date ?? "",
    address: (client as any).address ?? "",
    preferred_schedule: (client as any).preferred_schedule ?? "",
    preferences: client.preferences ?? "",
    interests: client.interests ?? "",
    notes: client.notes ?? "",
    internal_notes: client.internal_notes ?? "",
    clinical_notes: client.clinical_notes ?? "",
  }), [client]);

  // Auto-initialize editData when client loads
  useState(() => {
    if (client && Object.keys(editData).length === 0) {
      setEditData(getEditFields());
    }
  });

  // Keep editData in sync when client changes
  if (client && Object.keys(editData).length === 0) {
    setEditData(getEditFields());
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("clients").update({
        full_name: editData.full_name || client.full_name,
        email: editData.email || null,
        phone: editData.phone || null,
        cpf: editData.cpf || null,
        citizen_card_number: editData.citizen_card_number || null,
        profession: editData.profession || null,
        birth_date: editData.birth_date || null,
        address: editData.address || null,
        preferred_schedule: editData.preferred_schedule || null,
        preferences: editData.preferences || null,
        interests: editData.interests || null,
        notes: editData.notes || null,
        internal_notes: editData.internal_notes || null,
        clinical_notes: editData.clinical_notes || null,
      }).eq("id", clientId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setHasChanges(false);
      toast.success("Dados gravados com sucesso");
    } catch (err: any) {
      toast.error("Erro ao gravar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
    setHasChanges(true);
  };

  const interests = (editData.interests || client.interests || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const removeInterest = (index: number) => {
    const updated = [...interests];
    updated.splice(index, 1);
    updateField("interests", updated.join(", "));
  };

  const addInterest = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const updated = [...interests, trimmed];
    updateField("interests", updated.join(", "));
    setTagInput("");
  };

  const age = client.birth_date
    ? differenceInYears(new Date(), parse(client.birth_date, "yyyy-MM-dd", new Date()))
    : null;

  const currentData = editData.email !== undefined ? editData : getEditFields();

  const handleCancel = () => {
    setEditData(getEditFields());
    setHasChanges(false);
    setIsEditing(false);
    setTagInput("");
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Dados Cadastrais</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSaveAndClose} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? "A gravar..." : "Salvar"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
            {/* Row 1: Nome + Email + Telefone */}
            <EditableField label="Nome" value={currentData.full_name} onChange={(v) => updateField("full_name", v)} readOnly={!isEditing} />
            <EditableField label="Email" value={currentData.email} onChange={(v) => updateField("email", v)} readOnly={!isEditing} />
            <EditableField label="Telefone" value={currentData.phone} onChange={(v) => updateField("phone", v)} readOnly={!isEditing} isPhone />

            {/* Row 2: Nascimento + Idade + NIF + RG / CPF */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-4">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Nascimento</label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !currentData.birth_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {currentData.birth_date
                          ? format(parse(currentData.birth_date, "yyyy-MM-dd", new Date()), "d 'de' MMMM 'de' yyyy", { locale: pt })
                          : "Selecionar data..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarWidget
                        mode="single"
                        captionLayout="dropdown"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        selected={currentData.birth_date ? parse(currentData.birth_date, "yyyy-MM-dd", new Date()) : undefined}
                        onSelect={(date) => updateField("birth_date", date ? format(date, "yyyy-MM-dd") : "")}
                        disabled={(date) => date > new Date()}
                        locale={pt}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground flex items-center">
                    {client.birth_date ? fmtDate(client.birth_date + "T00:00:00") : "—"}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Idade</label>
                <div className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground flex items-center">
                  {age !== null ? `${age} anos` : "—"}
                </div>
              </div>
              <div className="md:col-span-3">
                <EditableField label="CPF" value={currentData.cpf} onChange={(v) => updateField("cpf", v)} readOnly={!isEditing} />
              </div>
              <div className="md:col-span-3">
                <EditableField label="RG / CPF" value={currentData.cpf_rg} onChange={(v) => updateField("citizen_card_number", v)} readOnly={!isEditing} />
              </div>
            </div>

            {/* Row 3: Profissão + Horário + Endereço */}
            <EditableField label="Profissão" value={currentData.profession} onChange={(v) => updateField("profession", v)} readOnly={!isEditing} />
            <EditableField label="Horário Preferido" value={currentData.preferred_schedule} onChange={(v) => updateField("preferred_schedule", v)} readOnly={!isEditing} />
            <EditableField label="Endereço" value={currentData.address} onChange={(v) => updateField("address", v)} readOnly={!isEditing} />

            {/* Gostos / Preferências - full width */}
            <div className="md:col-span-3">
              <EditableField label="Gostos / Preferências" value={currentData.preferences} onChange={(v) => updateField("preferences", v)} full textarea readOnly={!isEditing} />
            </div>

            {/* Interests as tags - full width */}
            <div className="md:col-span-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Interesses</label>
              <div className="flex flex-wrap gap-1.5 min-h-[40px] rounded-md border border-input bg-background px-3 py-2">
                {interests.length > 0 && interests.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 text-foreground px-2.5 py-0.5 text-xs font-medium"
                  >
                    {tag}
                    {isEditing && (
                      <button onClick={() => removeInterest(i)} className="hover:text-destructive ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {interests.length === 0 && !isEditing && (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
                {isEditing && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addInterest(tagInput);
                      }
                    }}
                    onBlur={() => addInterest(tagInput)}
                    placeholder="Adicionar interesse..."
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <EditableField label="Observações" value={currentData.notes} onChange={(v) => updateField("notes", v)} full textarea readOnly={!isEditing} />
            </div>
            {canEditClinical && <div className="md:col-span-3"><EditableField label="Notas Internas" value={currentData.internal_notes} onChange={(v) => updateField("internal_notes", v)} full textarea readOnly={!isEditing} /></div>}
            {canEditClinical && <div className="md:col-span-3"><EditableField label="Notas Clínicas" value={currentData.clinical_notes} onChange={(v) => updateField("clinical_notes", v)} full textarea readOnly={!isEditing} /></div>}
            {consentPdfPublicUrl && (
              <div className="md:col-span-3">
                <a href={consentPdfPublicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText className="w-4 h-4" /> Visualizar PDF de Consentimento <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marketing Opt-in Card */}
      <div className="mt-6 border border-border rounded-lg p-4 bg-card">
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={client.opt_in ?? false}
            onCheckedChange={async (v) => {
              const newVal = v === true;
              await supabase.from("clients").update({ opt_in: newVal }).eq("id", client.id);
              queryClient.invalidateQueries({ queryKey: ["client", client.id] });
              toast.success(newVal ? "Opt-in de marketing ativado" : "Opt-in de marketing desativado");
            }}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Consentimento de Marketing</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              O cliente aceita receber informações comerciais, promoções e comunicações adaptadas ao seu perfil e interesses.
            </p>
          </div>
        </label>
      </div>

      {/* Notification preferences (transactional) */}
      <div className="mt-4 border border-border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium text-foreground">Preferências de Notificação</p>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">
          Canais pelos quais o cliente recebe confirmações, alterações, cancelamentos e lembretes de marcação.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {([
            { key: "notify_whatsapp", label: "WhatsApp" },
            { key: "notify_email", label: "E-mail" },
            { key: "notify_sms", label: "SMS" },
          ] as const).map((c) => (
            <label key={c.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={(client as any)[c.key] ?? true}
                onCheckedChange={async (v) => {
                  const newVal = v === true;
                  await supabase.from("clients").update({ [c.key]: newVal } as any).eq("id", client.id);
                  queryClient.invalidateQueries({ queryKey: ["client", client.id] });
                  toast.success(`${c.label}: ${newVal ? "ativado" : "desativado"}`);
                }}
              />
              <span className="text-sm text-foreground">{c.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const EditableField = ({
  label, value, onChange, full, textarea, readOnly, isPhone,
}: {
  label: string; value: string;
  onChange: (value: string) => void;
  full?: boolean; textarea?: boolean; readOnly?: boolean; isPhone?: boolean;
}) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
    {readOnly ? (
      <div className="w-full min-h-[40px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
        {value || "—"}
      </div>
    ) : textarea ? (
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} />
    ) : isPhone ? (
      <PhoneInput value={value ?? ""} onChange={(v) => onChange(v)} />
    ) : (
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);


export default ClientDetail;
