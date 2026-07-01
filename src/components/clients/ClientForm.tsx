import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useClinicCountry } from "@/hooks/useClinicCountry";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, X, CalendarIcon } from "lucide-react";
import { maskCPF } from "@/lib/masks";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { RichEditor } from "@/components/ui/rich-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, differenceInYears } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

const clientSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  email: z.string().trim().email("Email inválido").max(255).or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  birth_date: z.string().optional(),
  profession: z.string().max(200).optional(),
  cpf: z.string().max(20).optional(),
  citizen_card_number: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  preferred_schedule: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  internal_notes: z.string().max(5000).optional(),
  clinical_notes: z.string().max(10000).optional(),
  preferences: z.string().max(5000).optional(),
  interests: z.string().max(5000).optional(),
  consent_given: z.boolean(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: Partial<ClientFormData> & { id?: string; consent_pdf_url?: string; preferences?: string; interests?: string };
  mode?: "create" | "edit";
}

const calcAge = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null;
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isNaN(d.getTime())) return null;
  return differenceInYears(new Date(), d);
};

export const ClientForm = ({ initialData, mode = "create" }: ClientFormProps) => {
  const navigate = useNavigate();
  const { user, canEditClinical } = useAuth();
  const queryClient = useQueryClient();
  const clinicCountry = useClinicCountry();

  const [form, setForm] = useState<ClientFormData>({
    full_name: initialData?.full_name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    birth_date: initialData?.birth_date ?? "",
    profession: initialData?.profession ?? "",
    cpf: initialData?.cpf ?? "",
    citizen_card_number: (initialData as any)?.citizen_card_number ?? "",
    address: initialData?.address ?? "",
    preferred_schedule: initialData?.preferred_schedule ?? "",
    notes: initialData?.notes ?? "",
    internal_notes: initialData?.internal_notes ?? "",
    clinical_notes: initialData?.clinical_notes ?? "",
    preferences: initialData?.preferences ?? "",
    interests: initialData?.interests ?? "",
    consent_given: initialData?.consent_given ?? false,
  });

  const [interestTags, setInterestTags] = useState<string[]>(
    initialData?.interests ? initialData.interests.split(",").map((t) => t.trim()).filter(Boolean) : []
  );
  const [tagInput, setTagInput] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const birthDate = form.birth_date
    ? parse(form.birth_date, "yyyy-MM-dd", new Date())
    : undefined;

  const age = calcAge(form.birth_date);

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      let consent_pdf_url = initialData?.consent_pdf_url ?? null;

      if (pdfFile) {
        const fileExt = pdfFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await storage
          .from("consent-pdfs")
          .upload(filePath, pdfFile, { contentType: "application/pdf" });
        if (uploadError) throw uploadError;
        consent_pdf_url = filePath;
      }

      const payload: any = {
        full_name: data.full_name.trim(),
        email: data.email || null,
        phone: data.phone || null,
        profession: data.profession || null,
        cpf: data.cpf || null,
        citizen_card_number: (data as any).citizen_card_number || null,
        address: data.address || null,
        preferred_schedule: data.preferred_schedule || null,
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        clinical_notes: data.clinical_notes || null,
        preferences: data.preferences || null,
        interests: data.interests || null,
        consent_given: data.consent_given,
        consent_pdf_url,
      };

      if (data.birth_date) {
        payload.birth_date = data.birth_date;
      } else {
        payload.birth_date = null;
      }

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...payload, created_by: user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: mode === "edit" ? "Cliente atualizado" : "Cliente cadastrado",
        description: "Dados salvos com sucesso.",
      });
      navigate("/clientes");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = clientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate({ ...result.data, interests: interestTags.join(", ") });
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (tag && !interestTags.includes(tag)) {
      const next = [...interestTags, tag];
      setInterestTags(next);
      setForm((prev) => ({ ...prev, interests: next.join(", ") }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const next = interestTags.filter((t) => t !== tag);
    setInterestTags(next);
    setForm((prev) => ({ ...prev, interests: next.join(", ") }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && interestTags.length > 0) {
      removeTag(interestTags[interestTags.length - 1]);
    }
  };

  const set = (field: keyof ClientFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-light tracking-wider">
            {mode === "edit" ? "Editar Cliente" : "Novo Cliente"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados do cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* ── Dados Pessoais ── */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <PhoneInput id="phone" value={form.phone || ""} onChange={(v) => set("phone", v)} defaultCountry={clinicCountry} />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={form.cpf || ""} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label htmlFor="citizen_card_number">RG / CPF</Label>
              <Input id="citizen_card_number" value={(form as any).citizen_card_number || ""} onChange={(e) => set("citizen_card_number" as any, e.target.value)} placeholder="Nº RG / CPF" />
            </div>
            <div>
              <Label htmlFor="profession">Profissão</Label>
              <Input id="profession" value={form.profession || ""} onChange={(e) => set("profession", e.target.value)} />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.birth_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate && !isNaN(birthDate.getTime())
                      ? format(birthDate, "d 'de' MMMM 'de' yyyy", { locale: pt })
                      : "Selecionar data..."}
                    {age !== null && (
                      <span className="ml-auto text-muted-foreground text-xs">{age} anos</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    selected={birthDate}
                    onSelect={(date) => {
                      set("birth_date", date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    disabled={(date) => date > new Date()}
                    locale={pt}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={form.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Endereço completo" />
            </div>
            <div>
              <Label htmlFor="preferred_schedule">Horário preferido</Label>
              <Input id="preferred_schedule" value={form.preferred_schedule || ""} onChange={(e) => set("preferred_schedule", e.target.value)} placeholder="Ex: Manhãs, fins de tarde..." />
            </div>
          </div>
        </section>

        {/* ── Caracterização ── */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Caracterização
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Gostos / Preferências</Label>
              <RichEditor
                value={form.preferences}
                onChange={(html) => set("preferences", html)}
                placeholder="Ex: aromas florais, música ambiente..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Interesses</Label>
              <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 min-h-[40px] items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {interestTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(",")) { addTag(v.slice(0, -1)); } else { setTagInput(v); }
                  }}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={interestTags.length === 0 ? "Digite e pressione vírgula ou Enter..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Observações ── */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Observações
          </h2>
          <div>
            <Label>Observações gerais</Label>
            <RichEditor
              value={form.notes}
              onChange={(html) => set("notes", html)}
            />
          </div>
          {canEditClinical && (
            <>
              <div>
                <Label>Notas internas</Label>
                <RichEditor
                  value={form.internal_notes}
                  onChange={(html) => set("internal_notes", html)}
                />
              </div>
              <div>
                <Label>Notas clínicas</Label>
                <RichEditor
                  value={form.clinical_notes}
                  onChange={(html) => set("clinical_notes", html)}
                />
              </div>
            </>
          )}
        </section>


        {/* ── Submit ── */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "edit" ? "Salvar Alterações" : "Cadastrar Cliente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};