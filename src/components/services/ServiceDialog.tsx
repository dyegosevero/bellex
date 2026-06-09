import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Camera, FileText, ClipboardList, Plus, Archive, ArchiveRestore, Trash2, PenLine, CalendarDays, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CategoryDialog from "@/components/services/CategoryDialog";
import type { ServiceRow, ServiceCategory } from "@/pages/Services";

const ServiceDialog = ({
  open, onOpenChange, editing, onSaved, maxOrder, categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ServiceRow | null;
  onSaved: () => void;
  maxOrder: number;
  categories: ServiceCategory[];
}) => {
  const queryClient = useQueryClient();

  const { data: defaultVatRate } = useQuery({
    queryKey: ["default-vat-rate"],
    queryFn: async () => {
      const { data } = await supabase.from("clinic_settings").select("default_vat_rate").limit(1).single();
      return (data as any)?.default_vat_rate ?? 23;
    },
    staleTime: 60_000,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState("EUR");
  const [vatRate, setVatRate] = useState<number | "">(0);
  const [color, setColor] = useState("#3B82F6");
  const [active, setActive] = useState(true);
  const [showOnBooking, setShowOnBooking] = useState(true);
  const [showPriceOnBooking, setShowPriceOnBooking] = useState(true);
  const [reqPhotos, setReqPhotos] = useState(false);
  const [consentPolicy, setConsentPolicy] = useState<"none" | "once" | "always">("none");
  const [reqCompletionSig, setReqCompletionSig] = useState(false);
  const [reqFichaRosto, setReqFichaRosto] = useState(false);
  const [reqFichaCorpo, setReqFichaCorpo] = useState(false);
  const [multiSession, setMultiSession] = useState(false);
  const [sessionCount, setSessionCount] = useState<number | "">(2);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingService, setDeletingService] = useState(false);

  const isArchived = !!(editing as any)?.archived;
  const navigate = useNavigate();

  const { data: allDocs = [] } = useQuery({
    queryKey: ["consent-texts-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("consent_texts")
        .select("id, label, description")
        .order("label");
      return (data ?? []) as { id: string; label: string; description: string | null }[];
    },
  });

  useQuery({
    queryKey: ["service-docs", editing?.id],
    queryFn: async () => {
      if (!editing?.id) return [];
      const { data } = await supabase
        .from("service_consent_texts")
        .select("consent_text_id")
        .eq("service_id", editing.id);
      const ids = (data ?? []).map((r: any) => r.consent_text_id);
      setSelectedDocIds(ids);
      return ids;
    },
    enabled: !!editing?.id,
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setDescription(editing.description ?? "");
        setDurationMinutes(editing.duration_minutes ?? "");
        setPrice(editing.price != null ? Number(editing.price).toFixed(2) : "");
        setCurrency(editing.currency ?? "BRL");
        setVatRate(editing.vat_rate ?? 0);
        setColor(editing.color ?? "#3B82F6");
        setActive(editing.active);
        setShowOnBooking(editing.show_on_booking_page);
        setShowPriceOnBooking(editing.show_price_on_booking_page);
        setReqPhotos(editing.requires_before_after_photos);
        setConsentPolicy(((editing as any).consent_policy as any) ?? (editing.requires_consent_form ? "once" : "none"));
        setReqCompletionSig((editing as any).requires_completion_signature ?? false);
        setCategoryId(editing.category_id ?? null);
        setMultiSession((editing as any).multi_session ?? false);
        setSessionCount((editing as any).session_count ?? 2);
        const formType = (editing as any).assessment_form_type ?? "";
        setReqFichaRosto(editing.requires_assessment_form && (formType === "rosto" || formType === "ambos"));
        setReqFichaCorpo(editing.requires_assessment_form && (formType === "corpo" || formType === "ambos"));
      } else {
        setName(""); setDescription(""); setDurationMinutes(30);
        setPrice(""); setCurrency("BRL"); setVatRate(defaultVatRate ?? 23);
        setColor("#3B82F6"); setActive(true); setShowOnBooking(true);
        setShowPriceOnBooking(true); setReqPhotos(false);
        setConsentPolicy("none"); setReqCompletionSig(false); setReqFichaRosto(false); setReqFichaCorpo(false);
        setCategoryId(null); setMultiSession(false); setSessionCount(2);
        setSelectedDocIds([]);
      }
    }
  }, [open, editing, defaultVatRate]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || null,
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
        price: price === "" ? null : Number(price),
        currency,
        vat_rate: vatRate === "" ? 0 : Number(vatRate),
        color,
        active,
        show_on_booking_page: showOnBooking,
        show_price_on_booking_page: showPriceOnBooking,
        requires_before_after_photos: reqPhotos,
        requires_consent_form: consentPolicy !== "none",
        consent_policy: consentPolicy,
        requires_assessment_form: reqFichaRosto || reqFichaCorpo,
        assessment_form_type: (reqFichaRosto && reqFichaCorpo) ? "ambos" : reqFichaCorpo ? "corpo" : reqFichaRosto ? "rosto" : null,
        category_id: categoryId,
        requires_completion_signature: reqCompletionSig,
        multi_session: multiSession,
        session_count: multiSession && sessionCount ? Number(sessionCount) : null,
      } as any;
      let serviceId: string;
      if (editing) {
        const { error, data } = await supabase.from("services").update(payload).eq("id", editing.id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Não foi possível atualizar o serviço. Verifique as suas permissões.");
        serviceId = editing.id;
      } else {
        const { error, data } = await supabase.from("services").insert({ ...payload, display_order: maxOrder }).select();
        if (error) throw error;
        serviceId = (data as any)[0].id;
      }
      await supabase.from("service_consent_texts" as any).delete().eq("service_id", serviceId);
      if (selectedDocIds.length > 0) {
        await supabase.from("service_consent_texts" as any).insert(
          selectedDocIds.map(docId => ({ service_id: serviceId, consent_text_id: docId }))
        );
      }
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
      toast.success(editing ? "Serviço atualizado." : "Serviço criado.");
    },
    onError: (err: any) => {
      console.error("Service save error:", JSON.stringify(err, null, 2));
      toast.error(`Erro ao salvar serviço: ${err?.message || err}`);
    },
  });

  const handleArchive = async () => {
    if (!editing) return;
    setArchiving(true);
    try {
      const { error } = await supabase.from("services").update({ archived: true, active: false }).eq("id", editing.id);
      if (error) throw error;
      toast.success("Serviço arquivado.");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!editing) return;
    setArchiving(true);
    try {
      const { error } = await supabase.from("services").update({ archived: false }).eq("id", editing.id);
      if (error) throw error;
      toast.success("Serviço restaurado do arquivo.");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!editing) return;
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("service_id", editing.id);
    if (count && count > 0) {
      setDeleteWarning(`Este serviço está associado a ${count} agendamento(s). Ao excluir, estes registos perderão a referência ao serviço.`);
    } else {
      setDeleteWarning(null);
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editing) return;
    setDeletingService(true);
    try {
      const { error } = await supabase.from("services").delete().eq("id", editing.id);
      if (error) throw error;
      toast.success("Serviço excluído.");
      onSaved();
      onOpenChange(false);
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingService(false);
    }
  };

  // Count active obligations for badge
  const obligationsCount = [
    reqPhotos,
    consentPolicy !== "none",
    selectedDocIds.length > 0,
    reqFichaRosto,
    reqFichaCorpo,
    reqCompletionSig,
  ].filter(Boolean).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Fixed header */}
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
              <DialogDescription>
                {editing ? "Atualize os dados do serviço" : "Preencha os dados do novo serviço"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-3">
              <Switch checked={active} onCheckedChange={setActive} id="service-active" />
              <Label htmlFor="service-active" className="text-sm text-muted-foreground">Ativo</Label>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (price === "" || price === null || price === undefined) {
                toast.error("O preço é obrigatório.");
                return;
              }
              mutation.mutate();
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <Tabs defaultValue="geral" className="flex flex-col flex-1 min-h-0">
              {/* Tab triggers */}
              <div className="px-6 pt-3 shrink-0">
                <TabsList className="w-full">
                  <TabsTrigger value="geral" className="flex-1">Geral</TabsTrigger>
                  <TabsTrigger value="obrigacoes" className="flex-1 gap-1.5">
                    Obrigações
                    {obligationsCount > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                        {obligationsCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Tab: Geral ── */}
              <TabsContent value="geral" className="flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-0">
                {/* Nome */}
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Limpeza de Pele" />
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
                  <div className="flex items-center gap-2">
                    <Select value={categoryId ?? "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? null : v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sem categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem categoria</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || "hsl(var(--primary))" }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setCatDialogOpen(true)} title="Nova Categoria">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CategoryDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} editing={null} onSaved={onSaved} maxOrder={categories.length + 1} />

                {/* Descrição */}
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                  <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do serviço..." />
                </div>

                {/* Duração + Preço + IVA */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duração (min)</Label>
                    <Input type="number" min={5} step={5} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : "")} placeholder="30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preço (R$) *</Label>
                    <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} onBlur={() => { if (price !== "") setPrice(Number(price).toFixed(2)); }} placeholder="0.00" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">IVA (%)</Label>
                    <Input type="number" min={0} max={100} step={1} value={vatRate} onChange={(e) => setVatRate(e.target.value ? Number(e.target.value) : "")} placeholder="23" />
                  </div>
                </div>

                {/* Cor */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cor</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-2 border-muted cursor-pointer p-0.5" />
                    <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3B82F6" className="flex-1 font-mono text-sm" maxLength={7} />
                  </div>
                </div>

                {/* Visibilidade */}
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Página de marcações</p>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Disponível para agendamento online</Label>
                    <Switch checked={showOnBooking} onCheckedChange={setShowOnBooking} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mostrar preço</Label>
                    <Switch checked={showPriceOnBooking} onCheckedChange={setShowPriceOnBooking} />
                  </div>
                </div>

                {/* Múltiplas sessões */}
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sessões</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Serviço tem múltiplas sessões</Label>
                    </div>
                    <Switch checked={multiSession} onCheckedChange={setMultiSession} />
                  </div>
                  {multiSession && (
                    <div className="space-y-1.5 pl-6">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nº total de sessões</Label>
                      <Input type="number" min={2} step={1} value={sessionCount} onChange={(e) => setSessionCount(e.target.value ? Number(e.target.value) : "")} placeholder="6" className="w-32" />
                      <p className="text-[10px] text-muted-foreground">
                        O consentimento assinado na 1ª sessão será herdado pelas {sessionCount ? Number(sessionCount) - 1 : "restantes"} sessões seguintes.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Tab: Obrigações ── */}
              <TabsContent value="obrigacoes" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
                {/* Fotos */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm">Fotos antes/depois</Label>
                      <p className="text-[11px] text-muted-foreground">Exige registo fotográfico na sessão</p>
                    </div>
                  </div>
                  <Switch checked={reqPhotos} onCheckedChange={(v) => { setReqPhotos(v); if (v && consentPolicy === "none") setConsentPolicy("once"); }} />
                </div>

                <div className="border-t border-border" />

                {/* Consentimento */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Política de consentimento</Label>
                  </div>
                  <Select value={consentPolicy} onValueChange={(v) => setConsentPolicy(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não pedir consentimento</SelectItem>
                      <SelectItem value="once">Pedir na 1ª sessão</SelectItem>
                      <SelectItem value="always">Pedir em todas as sessões</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    {consentPolicy === "once" && "Solicitado apenas se o cliente ainda não assinou para este serviço."}
                    {consentPolicy === "always" && "Solicitado obrigatoriamente em cada sessão."}
                    {consentPolicy === "none" && "Nunca solicitado automaticamente ao iniciar a sessão."}
                  </p>
                </div>

                <div className="border-t border-border" />

                {/* Documentos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileSignature className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Documentos para assinar</Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/documentos/novo")}
                      className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <Plus size={10} /> Novo documento
                    </button>
                  </div>
                  {allDocs.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">
                      Nenhum documento criado.{" "}
                      <button type="button" onClick={() => navigate("/documentos")} className="text-primary hover:underline">
                        Criar documento
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-0.5 pl-1">
                      {allDocs.map(doc => {
                        const checked = selectedDocIds.includes(doc.id);
                        return (
                          <label key={doc.id} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedDocIds(ids =>
                                  checked ? ids.filter(x => x !== doc.id) : [...ids, doc.id]
                                )
                              }
                              className="mt-0.5 w-3.5 h-3.5 accent-primary flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground">{doc.label}</p>
                              {doc.description && <p className="text-[10px] text-muted-foreground">{doc.description}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-border" />

                {/* Fichas + Assinatura */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Ficha de Rosto</Label>
                    </div>
                    <Switch checked={reqFichaRosto} onCheckedChange={setReqFichaRosto} />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Ficha de Corpo</Label>
                    </div>
                    <Switch checked={reqFichaCorpo} onCheckedChange={setReqFichaCorpo} />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                      <PenLine className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Assinatura de realização obrigatória</Label>
                    </div>
                    <Switch checked={reqCompletionSig} onCheckedChange={setReqCompletionSig} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Fixed footer */}
            <div className="px-6 py-4 border-t border-border shrink-0 space-y-3">
              {editing && isArchived && (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleUnarchive} disabled={archiving}>
                    {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                    Restaurar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="gap-1.5" onClick={handleDeleteClick} disabled={deletingService}>
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={mutation.isPending} className="flex-1">
                  {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? "Salvar" : "Criar Serviço"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              </div>

              {editing && !isArchived && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-destructive hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
                    onClick={() => setArchiveConfirmOpen(true)}
                    disabled={archiving}
                  >
                    {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    Arquivar
                  </button>
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarning ? (
                <span className="text-destructive font-medium">{deleteWarning}</span>
              ) : (
                "Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingService}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingService}
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
            >
              {deletingService && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Ao arquivar, o serviço ficará oculto na listagem principal, na página de agendamento e nos seletores.
              O histórico de agendamentos será preservado. Poderá restaurá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={archiving}
              onClick={(e) => { e.preventDefault(); handleArchive(); setArchiveConfirmOpen(false); }}
            >
              {archiving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServiceDialog;
