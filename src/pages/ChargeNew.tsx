import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fmtDateLong, fmtTime, fmtCurrency,
  getDocLabel, getDocPlaceholder, getCurrencySymbol,
  getVATRate, getVATLabel, getPaymentMethods, isPortugal,
} from "@/lib/date";
import { ChevronLeft, Loader2, CalendarIcon, Package, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ProductLine = {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
};

const ChargeNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const preClientId = searchParams.get("client_id") || "";
  const preClientName = searchParams.get("client_name") || "";
  const preAppointmentId = searchParams.get("appointment_id") || "";
  const preAppointmentDate = searchParams.get("appointment_date") || "";
  const preAmount = searchParams.get("amount") || "";

  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState(preClientId);
  const [clientName, setClientName] = useState(preClientName);
  const [clientNif, setClientNif] = useState("");
  const [clientHasNif, setClientHasNif] = useState(false);
  const [amount, setAmount] = useState(preAmount);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(clientSearch, 400);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const docLabel = getDocLabel();
  const docPlaceholder = getDocPlaceholder();
  const currencySymbol = getCurrencySymbol();
  const vatRate = getVATRate();
  const vatLabel = getVATLabel();
  const paymentMethods = getPaymentMethods();
  const ptLocale = isPortugal();

  // Discount calculations
  const rawAmount = parseFloat(amount) || 0;
  const productsTotal = productLines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const baseAmount = rawAmount + productsTotal;
  const discountVal = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percentage"
    ? Math.min(Math.round((baseAmount * discountVal) / 100 * 100) / 100, baseAmount)
    : Math.min(discountVal, baseAmount);
  const finalAmount = Math.max(baseAmount - discountAmount, 0);

  const isPreFilled = !!preClientId;

  useEffect(() => {
    if (preClientId) {
      supabase.from("clients").select("cpf, full_name").eq("id", preClientId).single().then(({ data }) => {
        if (data) {
          setClientNif(data.cpf || "");
          setClientHasNif(!!data.cpf);
          if (!preClientName && data.full_name) setClientName(data.full_name);
        }
      });
    }
  }, [preClientId, preClientName]);

  const { data: appointmentProducts } = useQuery({
    queryKey: ["charge-appointment-products", preAppointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name)")
        .eq("appointment_id", preAppointmentId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!preAppointmentId,
  });

  const { data: appointmentService } = useQuery({
    queryKey: ["charge-appointment-service", preAppointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("services(name, price)")
        .eq("id", preAppointmentId)
        .single();
      if (error) throw error;
      return (data as any)?.services ?? null;
    },
    enabled: !!preAppointmentId,
  });

  const { data: clientResults } = useQuery({
    queryKey: ["charge-client-search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const { data, error } = await supabase.rpc("search_clients", {
        search_term: debouncedSearch,
        page_number: 1,
        page_size: 8,
      });
      if (error) throw error;
      return data as Array<{ id: string; full_name: string; cpf: string }>;
    },
    enabled: debouncedSearch.length >= 2 && !isPreFilled,
  });

  // Products catalog (for manual product addition)
  const { data: allProducts } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price").eq("active", true).order("name");
      return data ?? [];
    },
    enabled: !preAppointmentId,
  });

  const filteredProducts = allProducts?.filter(p =>
    p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())
  ) ?? [];

  function addProduct(p: { id: string; name: string; price: number }) {
    setProductLines(prev => {
      const existing = prev.find(l => l.product_id === p.id);
      if (existing) {
        return prev.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: p.price, quantity: 1 }];
    });
    setProductSearch("");
  }

  function removeProduct(product_id: string) {
    setProductLines(prev => prev.filter(l => l.product_id !== product_id));
  }

  function updateQty(product_id: string, qty: number) {
    if (qty < 1) return removeProduct(product_id);
    setProductLines(prev => prev.map(l => l.product_id === product_id ? { ...l, quantity: qty } : l));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Selecione um cliente");
      if (finalAmount <= 0) throw new Error("Informe um valor válido");

      if (clientNif && !clientHasNif) {
        await supabase.from("clients").update({ cpf: clientNif }).eq("id", clientId);
      }

      const now = new Date().toISOString();
      const chargeData: any = {
        client_id: clientId,
        amount: finalAmount,
        discount_type: discountVal > 0 ? discountType : null,
        discount_value: discountVal > 0 ? discountVal : 0,
        discount_amount: discountVal > 0 ? discountAmount : 0,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        notes: [
          notes,
          paymentMethod ? `Forma de pagamento: ${paymentMethod}` : "",
          preAppointmentId ? `Atendimento: ${preAppointmentId}` : "",
        ].filter(Boolean).join(" | ") || null,
        created_by: user?.id ?? null,
        status: status || "pendente",
        appointment_id: preAppointmentId || null,
      };

      if (status === "pago") chargeData.paid_at = now;

      const { data, error } = await supabase.from("charges").insert(chargeData).select("id").single();
      if (error) throw error;

      const items: Array<{ charge_id: string; item_type: string; description: string; product_id?: string; quantity: number; unit_price: number }> = [];

      if (appointmentService) {
        const apProdTotal = appointmentProducts?.reduce((sum: number, p: any) => sum + p.unit_price * p.quantity, 0) ?? 0;
        const servicePrice = parseFloat(amount) - apProdTotal;
        if (servicePrice > 0) {
          items.push({ charge_id: data.id, item_type: "service", description: appointmentService.name ?? "Serviço", quantity: 1, unit_price: servicePrice });
        }
      } else if (!appointmentProducts?.length && productLines.length === 0) {
        items.push({ charge_id: data.id, item_type: "service", description: "Serviço", quantity: 1, unit_price: parseFloat(amount) });
      } else if (rawAmount > 0) {
        items.push({ charge_id: data.id, item_type: "service", description: "Serviço", quantity: 1, unit_price: rawAmount });
      }

      if (appointmentProducts?.length) {
        for (const ap of appointmentProducts) {
          items.push({ charge_id: data.id, item_type: "product", description: (ap as any).products?.name ?? "Produto", product_id: ap.product_id, quantity: ap.quantity, unit_price: ap.unit_price });
        }
      }

      for (const l of productLines) {
        items.push({ charge_id: data.id, item_type: "product", description: l.name, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price });
      }

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("charge_items").insert(items);
        if (itemsErr) console.error("Error inserting charge items:", itemsErr);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cobrança criada", description: "Salva com sucesso." });
      navigate(`/cobrancas/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-lg">
      <BlurFade delay={0.05}>
        <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/cobrancas")}>
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-light tracking-wider mb-1">Nova Cobrança</h1>
        <p className="text-sm text-muted-foreground mb-8">Registre uma nova cobrança para um cliente</p>
      </BlurFade>

      <BlurFade delay={0.15}>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente *</Label>
            {clientId ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium bg-muted px-3 py-1.5 rounded">{clientName}</span>
                {!isPreFilled && (
                  <Button type="button" variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => { setClientId(""); setClientName(""); setClientNif(""); setClientHasNif(false); }}>Trocar</Button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Buscar cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                {clientResults && clientResults.length > 0 && clientSearch && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {clientResults.map((c) => (
                      <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => { setClientId(c.id); setClientName(c.full_name); setClientNif(c.cpf || ""); setClientHasNif(!!c.cpf); setClientSearch(""); }}>
                        {c.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CPF / NIF do Cliente — opcional */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {docLabel} do Cliente <span className="normal-case font-normal text-muted-foreground/60">(opcional)</span>
            </Label>
            <Input
              value={clientNif}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, ptLocale ? 9 : 11);
                setClientNif(v);
              }}
              placeholder={docPlaceholder}
              inputMode="numeric"
              disabled={clientHasNif}
            />
            {clientHasNif && (
              <p className="text-xs text-muted-foreground">{docLabel} já cadastrado no cadastro do cliente.</p>
            )}
            {!clientHasNif && clientNif && clientId && (
              <p className="text-xs text-muted-foreground">O {docLabel} será salvo no cadastro do cliente ao criar a cobrança.</p>
            )}
          </div>

          {/* Atendimento reference */}
          {preAppointmentId && preAppointmentDate && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Atendimento</Label>
              <div className="text-sm bg-muted px-3 py-2 rounded">
                {fmtDateLong(preAppointmentDate)} às {fmtTime(preAppointmentDate)}
              </div>
            </div>
          )}

          {/* Breakdown: service + appointment products */}
          {preAppointmentId && (appointmentService || (appointmentProducts && appointmentProducts.length > 0)) && (
            <div className="bg-muted/50 rounded-lg px-4 py-3 space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Composição do valor</p>
              {appointmentService && (
                <div className="flex justify-between">
                  <span>{appointmentService.name ?? "Serviço"}</span>
                  <span>{fmtCurrency(appointmentService.price ?? 0)}</span>
                </div>
              )}
              {appointmentProducts?.map((ap: any) => (
                <div key={ap.id} className="flex justify-between text-muted-foreground">
                  <span>{ap.products?.name ?? "Produto"} x{ap.quantity}</span>
                  <span>{fmtCurrency(ap.unit_price * ap.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Valor do Serviço */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Valor do Serviço ({currencySymbol}) {!preAppointmentId && productLines.length === 0 ? "*" : ""}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                readOnly={!!preAmount && parseFloat(preAmount) > 0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-10", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={pt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Produtos adicionais (quando não é pré-preenchido de atendimento) */}
          {!preAppointmentId && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Produtos
              </Label>

              {productLines.length > 0 && (
                <div className="rounded-lg border border-border/50 divide-y divide-border/40">
                  {productLines.map((l) => (
                    <div key={l.product_id} className="flex items-center gap-3 px-3 py-2">
                      <span className="flex-1 text-sm truncate">{l.name}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateQty(l.product_id, l.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors text-xs">−</button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button type="button" onClick={() => updateQty(l.product_id, l.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors text-xs">+</button>
                      </div>
                      <span className="text-sm text-muted-foreground w-20 text-right">{fmtCurrency(l.unit_price * l.quantity)}</span>
                      <button type="button" onClick={() => removeProduct(l.product_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2"
                        onClick={() => addProduct(p)}>
                        <span className="flex items-center gap-2"><Plus className="w-3 h-3 text-muted-foreground" />{p.name}</span>
                        <span className="text-muted-foreground text-xs">{fmtCurrency(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desconto */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Desconto</Label>
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percentage")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">{currencySymbol}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={discountValue}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                  setDiscountValue(v);
                }}
                className="flex-1"
              />
              {discountType === "percentage" && discountVal > 0 && (
                <Input readOnly value={fmtCurrency(discountAmount)} className="w-[120px] bg-muted text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Resumo / IVA */}
          {(baseAmount > 0 || productLines.length > 0) && (
            <div className="bg-muted/50 rounded-lg px-4 py-3 space-y-1 text-sm">
              {productLines.length > 0 && rawAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Serviço</span>
                  <span>{fmtCurrency(rawAmount)}</span>
                </div>
              )}
              {productLines.length > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Produtos</span>
                  <span>{fmtCurrency(productsTotal)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{fmtCurrency(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Desconto {discountType === "percentage" ? `(${discountVal}%)` : ""}</span>
                    <span>-{fmtCurrency(discountAmount)}</span>
                  </div>
                </>
              )}
              {vatRate > 0 && vatLabel && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal (s/ {vatLabel})</span>
                    <span>{fmtCurrency(finalAmount / (1 + vatRate))}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{vatLabel} ({Math.round(vatRate * 100)}%)</span>
                    <span>{fmtCurrency(finalAmount - finalAmount / (1 + vatRate))}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-border">
                <span>Total</span>
                <span>{fmtCurrency(finalAmount)}</span>
              </div>
            </div>
          )}

          {/* Forma de Pagamento + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="nao_pago">Não Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Observações</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Cobrança
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/cobrancas")}>Cancelar</Button>
          </div>
        </form>
      </BlurFade>
    </div>
  );
};

export default ChargeNew;
