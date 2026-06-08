import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Download, Pencil, Share2, Loader2, CheckCircle2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { fmtCurrency, fmtDate, fmtDateTime } from "@/lib/date";
import { downloadChargePdf, generateChargeHtml, generateChargePdfBase64 } from "@/lib/charge-pdf";
import logoSrc from "@/assets/logo-color.png";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
  pendente: { label: "Pendente", cls: "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
  cancelado: { label: "Cancelado", cls: "border-destructive/30 bg-destructive/10 text-destructive" },
};

const ChargeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [sending, setSending] = useState<"email" | "whatsapp" | null>(null);
  const queryClient = useQueryClient();

  const { data: charge, isLoading } = useQuery({
    queryKey: ["charge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("*, clients(full_name, email, phone, cpf), appointments(start_time, services(name, vat_rate))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const chargeId = charge?.id;
  const appointmentId = charge?.appointment_id;

  // Fetch charge line items
  const { data: chargeItems } = useQuery({
    queryKey: ["charge-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charge_items")
        .select("*")
        .eq("charge_id", id!)
        .order("item_type")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chargeId,
  });

  // Fallback: fetch appointment products if no charge_items exist (legacy charges)
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-logo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("clinic_name, logo_url")
        .limit(1)
        .single();
      return data as { clinic_name: string | null; logo_url: string | null } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: appointmentProducts } = useQuery({
    queryKey: ["charge-products", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_products")
        .select("*, products(name)")
        .eq("appointment_id", appointmentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!appointmentId && (!chargeItems || chargeItems.length === 0),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse rounded w-3/4" />
        ))}
      </div>
    );
  }

  if (!charge) {
    return <p className="text-muted-foreground text-center py-12">Cobrança não encontrada.</p>;
  }

  const client = (charge as any).clients;
  const clientName = client?.full_name ?? "—";
  const status = STATUS_MAP[charge.status] ?? { label: charge.status, cls: "border-border bg-muted text-muted-foreground" };
  const serviceName = (charge as any)?.appointments?.services?.name;
  const vatRate = (charge as any)?.appointments?.services?.vat_rate ?? 0;

  const hasChargeItems = chargeItems && chargeItems.length > 0;
  const serviceItems = hasChargeItems ? chargeItems.filter((i: any) => i.item_type === "service") : [];
  const productItems = hasChargeItems ? chargeItems.filter((i: any) => i.item_type === "product") : [];

  const IVA_RATE = 23;
  const totalAmount = charge.amount;
  const chargeAny = charge as any;
  const discountAmountVal = parseFloat(chargeAny.discount_amount) || 0;
  const discountTypeVal = chargeAny.discount_type as string | null;
  const discountValueVal = parseFloat(chargeAny.discount_value) || 0;
  const grossAmount = totalAmount + discountAmountVal;
  const baseAmount = Math.round((totalAmount / (1 + IVA_RATE / 100)) * 100) / 100;
  const ivaValue = Math.round((totalAmount - baseAmount) * 100) / 100;

  // Build products list for PDF/share from charge_items or fallback to appointment_products
  const pdfProducts = hasChargeItems
    ? productItems.map((i: any) => ({ name: i.description, quantity: i.quantity, unitPrice: i.unit_price }))
    : appointmentProducts?.map((ap: any) => ({ name: ap.products?.name ?? "Produto", quantity: ap.quantity, unitPrice: ap.unit_price }));

  const pdfClinicData = {
    clinicName: clinicSettings?.clinic_name ?? null,
    clinicLogoUrl: clinicSettings?.logo_url ?? null,
  };

  const pdfServiceName = hasChargeItems
    ? serviceItems[0]?.description ?? serviceName
    : serviceName;

  const handleSend = async (sendType: "email" | "whatsapp") => {
    setSending(sendType);
    try {
      const chargeDataForPdf = {
        clientName,
        clientEmail: client?.email,
        clientPhone: client?.phone,
        amount: charge.amount,
        status: charge.status,
        createdAt: charge.created_at,
        dueDate: charge.due_date,
        paidAt: charge.paid_at,
        notes: charge.notes,
        serviceName: pdfServiceName,
        products: pdfProducts,
        discountType: discountTypeVal,
        discountValue: discountValueVal,
        discountAmount: discountAmountVal,
        ...pdfClinicData,
      };

      const pdfHtml = generateChargeHtml(chargeDataForPdf);

      let pdfBase64: string | undefined;
      if (sendType === "whatsapp") {
        pdfBase64 = await generateChargePdfBase64(chargeDataForPdf);
      }

      const { data, error } = await invokeEdgeFunction("send-charge", {
        body: { charge_id: id, send_type: sendType, pdf_html: pdfHtml, pdf_base64: pdfBase64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        sendType === "email"
          ? "Cobrança enviada por e-mail com sucesso!"
          : "Cobrança enviada por WhatsApp com sucesso!"
      );
      setShareOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar cobrança.");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => navigate("/cobrancas")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/cobrancas/${id}/editar`)}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadChargePdf({
                  clientName,
                  clientEmail: client?.email,
                  clientPhone: client?.phone,
                  amount: charge.amount,
                  status: charge.status,
                  createdAt: charge.created_at,
                  dueDate: charge.due_date,
                  paidAt: charge.paid_at,
                  notes: charge.notes,
                  serviceName: pdfServiceName,
                  products: pdfProducts,
                  discountType: discountTypeVal,
                  discountValue: discountValueVal,
                  discountAmount: discountAmountVal,
        ...pdfClinicData,
                });
              }}
            >
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4 mr-1" /> Compartilhar
            </Button>
            {charge.status !== "pago" && (
              <Button
                size="sm"
                className="gap-1.5 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
                onClick={async () => {
                  const { error } = await supabase
                    .from("charges")
                    .update({ status: "pago", paid_at: new Date().toISOString() })
                    .eq("id", id!);
                  if (error) { toast.error("Erro ao marcar como pago."); return; }
                  toast.success("Cobrança marcada como paga!");
                  queryClient.invalidateQueries({ queryKey: ["charge", id] });
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como Pago
              </Button>
            )}
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        {/* Invoice Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden print:border-0 print:rounded-none">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 flex items-start justify-between">
            <div>
              <img src={clinicSettings?.logo_url ?? logoSrc} alt={clinicSettings?.clinic_name ?? "Bellex"} className="h-10 mb-4 object-contain" />
              <p className="text-xs uppercase tracking-[3px] text-muted-foreground font-semibold">Recibo</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">#{id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.cls}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-8 h-px bg-border" />

          {/* Client & Dates */}
          <div className="px-8 py-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-[2px] text-muted-foreground mb-2 font-semibold">Emitido para</p>
              <p className="text-base font-semibold">{clientName}</p>
              {client?.email && <p className="text-sm text-muted-foreground mt-0.5">{client.email}</p>}
              {client?.phone && <p className="text-sm text-muted-foreground mt-0.5">{client.phone}</p>}
              {client?.cpf && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="uppercase tracking-wider text-xs font-semibold">CPF:</span> {client.cpf}
                </p>
              )}
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs uppercase tracking-[2px] text-muted-foreground font-semibold">Emissão</p>
                <p className="text-base">{fmtDate(charge.created_at)}</p>
              </div>
              {charge.due_date && (
                <div>
                  <p className="text-xs uppercase tracking-[2px] text-muted-foreground font-semibold">Vencimento</p>
                  <p className="text-base">{fmtDate(charge.due_date + "T00:00:00")}</p>
                </div>
              )}
              {charge.paid_at && (
                <div>
                  <p className="text-xs uppercase tracking-[2px] text-muted-foreground font-semibold">Pago em</p>
                  <p className="text-base">{fmtDateTime(charge.paid_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mx-8">
            <table className="w-full">
              <thead>
               <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-[2px] text-muted-foreground pb-2 font-semibold">Descrição</th>
                  <th className="text-right text-xs uppercase tracking-[2px] text-muted-foreground pb-2 font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {hasChargeItems ? (
                  <>
                    {serviceItems.map((item: any) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="py-4">
                          <p className="text-base font-medium">{item.description}</p>
                          {charge.notes && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{charge.notes.replace(/\s*\|\s*/g, "\n")}</p>}
                        </td>
                        <td className="py-4 text-right text-base font-medium">{fmtCurrency(item.unit_price * item.quantity)}</td>
                      </tr>
                    ))}
                    {productItems.map((item: any) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="py-3">
                          <p className="text-base">{item.description} <span className="text-muted-foreground">x{item.quantity}</span></p>
                        </td>
                        <td className="py-3 text-right text-base">{fmtCurrency(item.unit_price * item.quantity)}</td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <>
                    <tr className="border-b border-border">
                      <td className="py-4">
                        <p className="text-base font-medium">{serviceName ?? "Serviço"}</p>
                        {charge.notes && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{charge.notes.replace(/\s*\|\s*/g, "\n")}</p>}
                      </td>
                      <td className="py-4 text-right text-base font-medium">
                        {appointmentProducts && appointmentProducts.length > 0
                          ? fmtCurrency(totalAmount - appointmentProducts.reduce((sum: number, p: any) => sum + p.unit_price * p.quantity, 0))
                          : fmtCurrency(totalAmount)}
                      </td>
                    </tr>
                    {appointmentProducts?.map((ap: any) => (
                      <tr key={ap.id} className="border-b border-border">
                        <td className="py-3">
                          <p className="text-base">{ap.products?.name ?? "Produto"} <span className="text-muted-foreground">x{ap.quantity}</span></p>
                        </td>
                        <td className="py-3 text-right text-base">{fmtCurrency(ap.unit_price * ap.quantity)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Total with IVA breakdown */}
          <div className="mx-8 mt-4 mb-8 flex justify-end">
            <div className="w-64">
              {discountAmountVal > 0 && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Subtotal</span>
                    <span className="text-base">{fmtCurrency(grossAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border text-destructive">
                    <span className="text-sm uppercase tracking-wider font-semibold">Desconto {discountTypeVal === "percentage" ? `(${discountValueVal}%)` : ""}</span>
                    <span className="text-base">-{fmtCurrency(discountAmountVal)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Base</span>
                <span className="text-base">{fmtCurrency(baseAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">IVA ({IVA_RATE}%)</span>
                <span className="text-base">{fmtCurrency(ivaValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-base font-bold uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold">{fmtCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/30 px-8 py-4">
            <p className="text-xs text-muted-foreground text-center tracking-wide">
              Bellex · Documento gerado automaticamente
            </p>
          </div>
        </div>
      </BlurFade>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Compartilhar Cobrança</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Envie esta cobrança ao cliente por e-mail ou WhatsApp.</p>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              variant="outline"
              className="justify-start gap-3 h-12"
              onClick={() => handleSend("email")}
              disabled={sending !== null}
            >
              {sending === "email" ? (
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
              )}
              <div className="text-left">
                <p className="text-sm font-medium">E-mail</p>
                {client?.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-12"
              onClick={() => handleSend("whatsapp")}
              disabled={sending !== null}
            >
              {sending === "whatsapp" ? (
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
              ) : (
                <WhatsAppIcon className="w-5 h-5 shrink-0 text-[#25D366]" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium">WhatsApp</p>
                {client?.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChargeDetail;
