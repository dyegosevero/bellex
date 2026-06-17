import { useState } from "react";
import { differenceInYears, parse, format } from "date-fns";
import { pt } from "date-fns/locale";
import { fmtDate } from "@/lib/date";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, Save, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientData {
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  profession: string | null;
  cpf: string | null;
  citizen_card_number: string | null;
  address: string | null;
  preferred_schedule: string | null;
}

interface Props {
  client: ClientData;
  clientId: string;
  onSaved?: () => void;
}

export default function SessionDataTab({ client, clientId, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: client.full_name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    birth_date: client.birth_date ?? "",
    profession: client.profession ?? "",
    cpf: client.cpf ?? "",
    citizen_card_number: client.citizen_card_number ?? "",
    address: client.address ?? "",
    preferred_schedule: client.preferred_schedule ?? "",
  });

  const age = client.birth_date
    ? differenceInYears(new Date(), parse(client.birth_date, "yyyy-MM-dd", new Date()))
    : null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        email: form.email || null,
        birth_date: form.birth_date || null,
        profession: form.profession || null,
        cpf: form.cpf || null,
        citizen_card_number: form.citizen_card_number || null,
        address: form.address || null,
        preferred_schedule: form.preferred_schedule || null,
      })
      .eq("id", clientId);
    setSaving(false);
    if (error) {
      toast.error("Erro ao gravar dados do cliente.");
      return;
    }
    toast.success("Dados do cliente atualizados.");
    setEditing(false);
    onSaved?.();
  };

  const handleCancel = () => {
    setForm({
      full_name: client.full_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      birth_date: client.birth_date ?? "",
      profession: client.profession ?? "",
      cpf: client.cpf ?? "",
      citizen_card_number: client.citizen_card_number ?? "",
      address: client.address ?? "",
      preferred_schedule: client.preferred_schedule ?? "",
    });
    setEditing(false);
  };

  const renderField = (label: string, value: string, onChange?: (v: string) => void, type?: string) => (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      {editing && onChange ? (
        <input
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <div className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground flex items-center">
          {value || "—"}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Dados do Cliente</h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
          {/* Row 1: Nome + Email + Telefone */}
          {renderField("Nome", form.full_name, (v) => setForm(p => ({ ...p, full_name: v })))}
          {renderField("Email", form.email, (v) => setForm(p => ({ ...p, email: v })))}
          {renderField("Telefone", form.phone, (v) => setForm(p => ({ ...p, phone: v })))}

          {/* Row 2: Nascimento + Idade + NIF + RG / CPF */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Nascimento</label>
              {editing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !form.birth_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {form.birth_date
                        ? format(parse(form.birth_date, "yyyy-MM-dd", new Date()), "d 'de' MMMM 'de' yyyy", { locale: pt })
                        : "Selecionar data..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      captionLayout="dropdown"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      selected={form.birth_date ? parse(form.birth_date, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(date) => setForm(p => ({ ...p, birth_date: date ? format(date, "yyyy-MM-dd") : "" }))}
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
              {renderField("CPF", form.cpf, (v) => setForm(p => ({ ...p, cpf: v })))}
            </div>
            <div className="md:col-span-3">
              {renderField("RG / CPF", form.citizen_card_number, (v) => setForm(p => ({ ...p, citizen_card_number: v })))}
            </div>
          </div>

          {/* Row 3: Profissão + Horário Preferido + Endereço */}
          {renderField("Profissão", form.profession, (v) => setForm(p => ({ ...p, profession: v })))}
          {renderField("Horário Preferido", form.preferred_schedule, (v) => setForm(p => ({ ...p, preferred_schedule: v })))}
          {renderField("Endereço", form.address, (v) => setForm(p => ({ ...p, address: v })))}
        </div>
      </div>
    </div>
  );
}
