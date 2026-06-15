import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  useServices,
  useServiceFormFields,
  useSpecialists,
  useActiveProducts,
} from "@/hooks/useAppointmentData";
import { DynamicFormFields } from "@/components/appointments/DynamicFormFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { fireBookingWebhook } from "@/lib/webhook";
import { withTimezoneOffset } from "@/lib/date";

interface ProductLine {
  product_id: string;
  quantity: number;
  unit_price: number;
  name: string;
}

const AppointmentNew = () => {
  const navigate = useNavigate();
  const { user, role, isReceptionist, canEditClinical } = useAuth();
  const queryClient = useQueryClient();

  const { data: services } = useServices();
  const { data: specialists } = useSpecialists();
  const { data: products } = useActiveProducts();

  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientConsent, setClientConsent] = useState<boolean | null>(null);
  const [specialistId, setSpecialistId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("agendado");

  const { data: formFields } = useServiceFormFields(serviceId || null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [productLines, setProductLines] = useState<ProductLine[]>([]);

  const debouncedClientSearch = useDebounce(clientSearch, 400);

  const { data: clientResults } = useQuery({
    queryKey: ["client-search-autocomplete", debouncedClientSearch],
    queryFn: async () => {
      if (!debouncedClientSearch || debouncedClientSearch.length < 2) return [];
      const { data, error } = await supabase.rpc("search_clients", {
        search_term: debouncedClientSearch,
        page_number: 1,
        page_size: 8,
      });
      if (error) throw error;
      return data as Array<{ id: string; full_name: string; phone: string | null }>;
    },
    enabled: debouncedClientSearch.length >= 2,
  });

  // Fetch client consent status when client is selected
  const selectClient = async (id: string, name: string) => {
    setClientId(id);
    setClientName(name);
    setClientSearch("");
    const { data } = await supabase
      .from("clients")
      .select("consent_given")
      .eq("id", id)
      .single();
    setClientConsent(data?.consent_given ?? false);
  };

  // Determine which statuses this role can set
  const availableStatuses = (() => {
    const base = [
      { value: "agendado", label: "Agendado" },
      { value: "em_atendimento", label: "Em atendimento" },
      { value: "realizado", label: "Realizado" },
      { value: "concluido", label: "Concluído" },
      { value: "cancelado", label: "Cancelado" },
    ];
    // Receptionist cannot mark as realizado (only specialist/admin can finalize clinical work)
    if (isReceptionist) {
      return base.filter((s) => s.value !== "realizado");
    }
    return base;
  })();

  const consentBlocked = clientConsent === false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Selecione um cliente");
      if (!startTime) throw new Error("Informe a data/hora");

      if (consentBlocked) {
        throw new Error("O cliente precisa ter o consentimento registrado antes de iniciar o atendimento.");
      }

      if (formFields && status === "realizado") {
        const errs: Record<string, string> = {};
        for (const f of formFields) {
          if (f.required) {
            if (f.field_type === "photo_upload") {
              if (!fileValues[f.field_name]?.length) errs[f.field_name] = "Campo obrigatório";
            } else if (!fieldValues[f.field_name]?.trim()) {
              errs[f.field_name] = "Campo obrigatório";
            }
          }
        }
        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
          throw new Error("Preencha os campos obrigatórios do formulário de conclusão");
        }
      }

      if (isReceptionist && status === "realizado") {
        throw new Error("Apenas especialistas ou admins podem marcar como realizado.");
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          client_id: clientId,
          specialist_id: specialistId || null,
          attendant_id: user?.id ?? null,
          service_id: serviceId || null,
          start_time: withTimezoneOffset(startTime),
          status,
          notes: notes || null,
        })
        .select("id, cancellation_token")
        .single();
      if (error) throw error;

      const appointmentId = appointment.id;

      // Save form responses
      if (formFields) {
        for (const field of formFields) {
          let file_urls: string[] | null = null;
          if (field.field_type === "photo_upload" && fileValues[field.field_name]?.length) {
            file_urls = [];
            for (const file of fileValues[field.field_name]) {
              const ext = file.name.split(".").pop();
              const path = `${appointmentId}/${field.field_name}/${crypto.randomUUID()}.${ext}`;
              const { error: upErr } = await storage.from("appointment-photos").upload(path, file);
              if (upErr) throw upErr;
              file_urls.push(path);
            }
          }
          if (fieldValues[field.field_name] || file_urls?.length) {
            await supabase.from("appointment_form_responses").insert({
              appointment_id: appointmentId,
              field_id: field.id,
              value: fieldValues[field.field_name] || null,
              file_urls: file_urls ?? null,
            });
          }
        }
      }

      // Save products (stock will be deducted when session is finalized)
      if (productLines.length > 0) {
        const { error: prodErr } = await supabase.from("appointment_products").insert(
          productLines.map((pl) => ({
            appointment_id: appointmentId,
            product_id: pl.product_id,
            quantity: pl.quantity,
            unit_price: pl.unit_price,
          }))
        );
        if (prodErr) throw prodErr;
      }

      return { id: appointmentId, cancellation_token: appointment.cancellation_token };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Atendimento criado", description: "Salvo com sucesso." });

      const svc = services?.find((s) => s.id === serviceId);
      fireBookingWebhook({
        event: "confirmed",
        appointment_id: result.id,
        cancellation_token: result.cancellation_token,
        client: { full_name: clientName, phone: null, email: null },
        client_id: clientId || null,
        service_id: serviceId || null,
        service_name: svc?.name ?? null,
        start_time: withTimezoneOffset(startTime),
        specialist_id: specialistId || null,
      });

      navigate("/dashboard");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const addProductLine = () => {
    if (!products?.length) return;
    const first = products[0];
    setProductLines((prev) => [...prev, { product_id: first.id, quantity: 1, unit_price: first.price, name: first.name }]);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-light tracking-wider">Novo Atendimento</h1>
          <p className="text-sm text-muted-foreground mt-1">Agende ou registre um atendimento</p>
        </div>
      </div>

      {/* BUSINESS RULE: Consent warning */}
      {consentBlocked && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este cliente não possui consentimento registrado. Registre o consentimento no cadastro do cliente antes de criar o atendimento.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-8 max-w-3xl">
        {/* ── Dados Básicos ── */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Dados do Atendimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Cliente *</Label>
              {clientId ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium bg-muted px-3 py-1.5 rounded">{clientName}</span>
                  {clientConsent && (
                    <span className="text-[10px] uppercase tracking-wider bg-success/10 text-success px-2 py-0.5 rounded">
                      Consentimento ✓
                    </span>
                  )}
                  {clientConsent === false && (
                    <span className="text-[10px] uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      Sem consentimento
                    </span>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setClientId(""); setClientName(""); setClientConsent(null); }}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input placeholder="Buscar cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  {clientResults && clientResults.length > 0 && clientSearch && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {clientResults.map((c) => (
                        <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => selectClient(c.id, c.full_name)}
                        >
                          {c.full_name}
                          {c.phone && <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label>Especialista</Label>
              <Select value={specialistId} onValueChange={setSpecialistId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {specialists?.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Serviço</Label>
              <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setFieldValues({}); setFileValues({}); setFieldErrors({}); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {services?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data / Hora *</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Dynamic Form (hidden for receptionist) ── */}
        {canEditClinical && formFields && formFields.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Formulário — {services?.find((s) => s.id === serviceId)?.name}
            </h2>
            <DynamicFormFields
              fields={formFields}
              values={fieldValues}
              fileValues={fileValues}
              existingUrls={{}}
              onChange={(name, val) => setFieldValues((p) => ({ ...p, [name]: val }))}
              onFileChange={(name, files) => setFileValues((p) => ({ ...p, [name]: files }))}
              errors={fieldErrors}
            />
          </section>
        )}

        {/* ── Products (visible to specialist + admin) ── */}
        {canEditClinical && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Produtos Vendidos</h2>
              <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
            {productLines.length > 0 ? (
              <div className="space-y-3">
                {productLines.map((pl, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Select value={pl.product_id} onValueChange={(v) => {
                      const p = products?.find((pr) => pr.id === v);
                      if (p) setProductLines((prev) => prev.map((line, idx) => idx === i ? { ...line, product_id: p.id, unit_price: p.price, name: p.name } : line));
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min={1} className="w-20" value={pl.quantity}
                      onChange={(e) => setProductLines((prev) => prev.map((line, idx) => idx === i ? { ...line, quantity: parseInt(e.target.value) || 1 } : line))}
                    />
                    <span className="text-sm text-muted-foreground w-24 text-right">
                      {(pl.unit_price * pl.quantity).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setProductLines((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum produto adicionado.</p>
            )}
          </section>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={mutation.isPending || consentBlocked}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Atendimento
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentNew;
