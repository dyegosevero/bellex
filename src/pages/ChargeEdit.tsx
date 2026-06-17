import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { fmtCurrency } from "@/lib/date";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ChargeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pendente");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [clientNif, setClientNif] = useState("");
  const [clientHasNif, setClientHasNif] = useState(false);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");

  const { data: charge, isLoading } = useQuery({
    queryKey: ["charge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("*, clients(full_name, cpf)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Discount calculations
  const rawAmount = parseFloat(originalAmount || amount) || 0;
  const discountVal = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percentage"
    ? Math.min(Math.round((rawAmount * discountVal) / 100 * 100) / 100, rawAmount)
    : Math.min(discountVal, rawAmount);
  const finalAmount = Math.max(rawAmount - discountAmount, 0);

  useEffect(() => {
    if (charge) {
      const chargeAny = charge as any;
      const storedDiscountAmount = parseFloat(chargeAny.discount_amount) || 0;
      const storedOriginal = charge.amount + storedDiscountAmount;
      setOriginalAmount(String(storedOriginal));
      setAmount(String(storedOriginal));
      setDueDate(charge.due_date ? new Date(charge.due_date + "T00:00:00") : undefined);
      setStatus(charge.status);
      const clientData = chargeAny.clients;
      setClientNif(clientData?.cpf || "");
      setClientHasNif(!!clientData?.cpf);

      // Load discount fields
      if (chargeAny.discount_type) setDiscountType(chargeAny.discount_type);
      if (chargeAny.discount_value > 0) setDiscountValue(String(chargeAny.discount_value));

      // Extract payment method and clean notes
      const rawNotes = charge.notes ?? "";
      const pmMatch = rawNotes.match(/Forma de pagamento:\s*(\S+)/);
      if (pmMatch) setPaymentMethod(pmMatch[1]);
      setNotes(rawNotes.replace(/\s*\|\s*Forma de pagamento:\s*\S+/, "").replace(/\s*\|\s*Atendimento:\s*[\w-]+/, "").trim());
    }
  }, [charge]);

  const mutation = useMutation({
    mutationFn: async () => {
      const composedNotes = [
        notes,
        paymentMethod ? `Forma de pagamento: ${paymentMethod}` : "",
      ].filter(Boolean).join(" | ") || null;

      // Update client NIF if provided and client doesn't have one
      if (clientNif && !clientHasNif && charge?.client_id) {
        await supabase.from("clients").update({ cpf: clientNif }).eq("id", charge.client_id);
      }

      const update: Record<string, unknown> = {
        amount: finalAmount,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        notes: composedNotes,
        status,
        discount_type: discountVal > 0 ? discountType : null,
        discount_value: discountVal > 0 ? discountVal : 0,
        discount_amount: discountVal > 0 ? discountAmount : 0,
      };
      if (status === "pago" && charge?.status !== "pago") {
        update.paid_at = new Date().toISOString();
      }
      const { error } = await supabase.from("charges").update(update).eq("id", id!);
      if (error) throw error;

      // Restore stock when charge is cancelled
      if (status === "cancelado" && charge?.status !== "cancelado") {
        const { data: chargeItems } = await supabase
          .from("charge_items")
          .select("product_id, quantity")
          .eq("charge_id", id!)
          .eq("item_type", "product");
        if (chargeItems && chargeItems.length > 0) {
          for (const item of chargeItems) {
            if (!item.product_id) continue;
            await supabase.rpc("restore_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      queryClient.invalidateQueries({ queryKey: ["charge", id] });
      toast({ title: "Cobrança atualizada" });
      navigate(`/cobrancas/${id}`);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse rounded w-3/4" />
        ))}
      </div>
    );
  }

  if (!charge) return <p className="text-muted-foreground">Cobrança não encontrada.</p>;

  const isPaid = charge.status === "pago";
  const clientName = (charge as any).clients?.full_name ?? "—";

  return (
    <div className="max-w-lg">
      <BlurFade delay={0.05}>
        <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate(`/cobrancas/${id}`)}>
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-light tracking-wider mb-1">Editar Cobrança</h1>
        <p className="text-sm text-muted-foreground mb-8">{clientName}</p>
      </BlurFade>

      <BlurFade delay={0.15}>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
          {/* CPF do Cliente */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">CPF do Cliente</Label>
            <Input
              value={clientNif}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                setClientNif(v);
              }}
              placeholder="000 000 000"
              maxLength={9}
              inputMode="numeric"
              disabled={clientHasNif}
            />
            {clientHasNif && (
              <p className="text-xs text-muted-foreground">CPF já cadastrado no cadastro do cliente.</p>
            )}
            {!clientHasNif && clientNif && (
              <p className="text-xs text-muted-foreground">O CPF será salvo no cadastro do cliente ao salvar.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor (€) *</Label>
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={amount}
                disabled={isPaid}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                  setAmount(v);
                  setOriginalAmount(v);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPaid}
                    className={cn("w-full justify-start text-left font-normal h-10", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={pt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="mbway">Pix</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {charge.status === "pago" ? (
                    <>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </>
                  ) : charge.status === "cancelado" ? (
                    <>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desconto */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Desconto</Label>
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percentage")} disabled={isPaid}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">R$</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={discountValue}
                disabled={isPaid}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                  setDiscountValue(v);
                }}
                className="flex-1"
              />
              {discountType === "percentage" && discountVal > 0 && (
                <Input
                  readOnly
                  value={fmtCurrency(discountAmount)}
                  className="w-[120px] bg-muted text-muted-foreground"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Observações</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/cobrancas/${id}`)}>Cancelar</Button>
          </div>
        </form>
      </BlurFade>
    </div>
  );
};

export default ChargeEdit;
