import { fmtCurrency, fmtDate, fmtDateTime } from "@/lib/date";

interface ChargeLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface ChargeData {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  amount: number;
  status: string;
  createdAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  serviceName?: string | null;
  products?: ChargeLineItem[];
  discountType?: string | null;
  discountValue?: number;
  discountAmount?: number;
  clinicName?: string | null;
  clinicLogoUrl?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pago: "PAGO",
  pendente: "PENDENTE",
  cancelado: "CANCELADO",
};

const RECEIPT_WIDTH_PX = 580;
const RECEIPT_WIDTH_MM = 152;
const PDF_MARGIN_MM = 2;
const PDF_MIN_HEIGHT_MM = 200;
const PDF_HEIGHT_BUFFER_MM = 14;

// Fallback quando a clínica não tem logo configurado — bloco neutro com nome
function fallbackLogoHtml(clinicName: string | null | undefined): string {
  const name = clinicName ?? "Clínica";
  return `<div style="font-size:20px;font-weight:700;letter-spacing:.04em;color:#222;text-align:center;padding:4px 0">${name}</div>`;
}

function getReceiptPageSizeMm(receiptEl: HTMLElement) {
  const ratio = RECEIPT_WIDTH_MM / RECEIPT_WIDTH_PX;
  const contentWidthPx = Math.ceil(Math.max(receiptEl.scrollWidth, receiptEl.getBoundingClientRect().width));
  const contentHeightPx = Math.ceil(Math.max(receiptEl.scrollHeight, receiptEl.getBoundingClientRect().height));

  return {
    width: Math.max(RECEIPT_WIDTH_MM, Math.ceil(contentWidthPx * ratio) + PDF_MARGIN_MM * 2),
    height: Math.max(PDF_MIN_HEIGHT_MM, Math.ceil(contentHeightPx * ratio) + PDF_MARGIN_MM * 2 + PDF_HEIGHT_BUFFER_MM),
  };
}

async function waitForReceiptLayout() {
  if ("fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font loading issues and continue with the current layout
    }
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mbway: "Pix",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência Bancária",
  boleto: "Boleto",
  cheque: "Cheque",
};

function normalizeNotes(notes: string | null | undefined): string | null | undefined {
  if (!notes) return notes;
  return notes.replace(/Forma de pagamento:\s*(\S+)/g, (_, method) => {
    const label = PAYMENT_METHOD_LABELS[method] ?? method;
    return `Forma de pagamento: ${label}`;
  });
}

export function generateChargeHtml(charge: ChargeData): string {
  const stLabel = STATUS_LABELS[charge.status] ?? charge.status;
  const notes = normalizeNotes(charge.notes);

  const hasDiscount = (charge.discountAmount ?? 0) > 0;
  const subtotal = hasDiscount ? charge.amount + (charge.discountAmount ?? 0) : charge.amount;
  const base = Math.round((charge.amount / 1.23) * 100) / 100;
  const iva = Math.round((charge.amount - base) * 100) / 100;

  let serviceAmount = charge.amount;
  if (charge.products && charge.products.length > 0) {
    serviceAmount = charge.amount - charge.products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  }

  const productRows = (charge.products ?? [])
    .map(
      (p) => `
    <tr>
      <td class="item-name">${p.name} <span>x${p.quantity}</span></td>
      <td class="item-val">${fmtCurrency(p.quantity * p.unitPrice)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Recibo</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Arial','Helvetica Neue',system-ui,sans-serif;
    background:#fff;
    color:#000;
    padding:0;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .receipt{
    width:100%;
    max-width:${RECEIPT_WIDTH_PX}px;
    margin:0 auto;
    padding:16px 12px 20px;
    background:#fff;
  }

  .logo{text-align:center;padding:4px 0 8px}
  .logo svg{width:220px;height:auto;max-width:100%}

  .header{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    gap:10px;
    border-bottom:2px solid #000;
    padding-bottom:7px;
    margin-bottom:10px;
  }
  .title{font-size:21px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;min-width:0}
  .status{font-size:17px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;text-align:right;flex-shrink:0}

  .sep{border:none;border-top:1px dashed #000;margin:10px 0}
  .info-section{margin-bottom:5px}
  .info-label{font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px}
  .info-val{font-size:19px;font-weight:700;line-height:1.3;overflow-wrap:anywhere;word-break:break-word}
  .info-val-sm{font-size:16px;line-height:1.3;overflow-wrap:anywhere;word-break:break-word}
  .info-grid{display:flex;justify-content:space-between;gap:10px;margin-bottom:5px}
  .info-grid .col{flex:1}
  .info-grid .col-r{text-align:right}

  table{width:100%;border-collapse:collapse;margin:8px 0;table-layout:fixed}
  th{
    font-size:15px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:0.8px;
    padding:5px 0;
    border-bottom:2px solid #000;
    text-align:left;
  }
  th:first-child{width:68%}
  th:last-child{width:32%;text-align:right}
  td.item-name{
    font-size:17px;
    font-weight:700;
    padding:7px 4px 7px 0;
    border-bottom:1px solid #000;
    line-height:1.25;
    word-wrap:break-word;
    overflow-wrap:anywhere;
    vertical-align:top;
  }
  td.item-val{
    font-size:17px;
    font-weight:800;
    padding:7px 0 7px 8px;
    border-bottom:1px solid #000;
    text-align:right;
    white-space:nowrap;
    vertical-align:top;
  }
  .desc-sub{font-size:15px;font-weight:500;margin-top:3px;line-height:1.25;overflow-wrap:anywhere}

  .totals{margin-top:10px}
  .total-row{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    padding:4px 0;
    font-size:17px;
    font-weight:700;
    border-bottom:1px dashed #000;
    gap:8px;
  }
  .total-row span:first-child{min-width:0;overflow-wrap:anywhere}
  .total-row span:last-child{white-space:nowrap;flex-shrink:0}
  .total-final{
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    padding:10px 0 4px;
    border-top:2px solid #000;
    margin-top:5px;
    gap:8px;
  }
  .total-final .lbl{font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;min-width:0}
  .total-final .amount{font-size:26px;font-weight:800;text-align:right;white-space:nowrap;flex-shrink:0}

  .footer{
    margin-top:12px;
    padding-top:8px;
    border-top:1px dashed #000;
    text-align:center;
    font-size:14px;
    font-weight:600;
    letter-spacing:0.25px;
    line-height:1.35;
  }

  @media print{
    body{padding:0}
    .receipt{max-width:none;padding:6px}
  }
</style></head><body>
<div class="receipt">
  <div class="logo">${charge.clinicLogoUrl
    ? `<img src="${charge.clinicLogoUrl}" alt="${charge.clinicName ?? 'Logo'}" style="height:40px;max-width:220px;object-fit:contain;display:block;margin:0 auto"/>`
    : fallbackLogoHtml(charge.clinicName)
  }</div>

  <div class="header">
    <span class="title">Recibo</span>
    <span class="status">${stLabel}</span>
  </div>

  <div class="info-section">
    <div class="info-label">Emitido para</div>
    <div class="info-val">${charge.clientName}</div>
    ${charge.clientEmail ? `<div class="info-val-sm">${charge.clientEmail}</div>` : ""}
    ${charge.clientPhone ? `<div class="info-val-sm">${charge.clientPhone}</div>` : ""}
  </div>

  <hr class="sep"/>

  <div class="info-grid">
    <div class="col">
      <div class="info-label">Emissão</div>
      <div class="info-val-sm">${fmtDate(charge.createdAt)}</div>
    </div>
    ${
      charge.dueDate
        ? `
    <div class="col col-r">
      <div class="info-label">Vencimento</div>
      <div class="info-val-sm">${fmtDate(charge.dueDate + "T00:00:00")}</div>
    </div>`
        : ""
    }
  </div>

  ${
    charge.paidAt
      ? `
  <div class="info-section">
    <div class="info-label">Pago em</div>
    <div class="info-val-sm">${fmtDateTime(charge.paidAt)}</div>
  </div>`
      : ""
  }

  <hr class="sep"/>

  <table>
    <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
    <tbody>
      <tr>
        <td class="item-name">
          ${charge.serviceName ?? "Serviço"}
          ${notes ? `<div class="desc-sub">${notes.replace(/\s*\|\s*/g, "<br/>")}</div>` : ""}
        </td>
        <td class="item-val">${fmtCurrency(serviceAmount)}</td>
      </tr>
      ${productRows}
    </tbody>
  </table>

  <div class="totals">
    ${
      hasDiscount
        ? `
    <div class="total-row"><span>Subtotal</span><span>${fmtCurrency(subtotal)}</span></div>
    <div class="total-row"><span>Desconto${charge.discountType === "percentage" ? ` (${charge.discountValue}%)` : ""}</span><span>-${fmtCurrency(charge.discountAmount ?? 0)}</span></div>
    `
        : ""
    }
    <div class="total-row"><span>Base</span><span>${fmtCurrency(base)}</span></div>
    <div class="total-row"><span>IVA (23%)</span><span>${fmtCurrency(iva)}</span></div>
    <div class="total-final">
      <span class="lbl">Total</span>
      <span class="amount">${fmtCurrency(charge.amount)}</span>
    </div>
  </div>

  <div class="footer">
    Bellex · Documento gerado<br/>automaticamente · ${fmtDate(new Date().toISOString())}
  </div>
</div>
</body></html>`;
}

export async function generateChargePdfBase64(charge: ChargeData): Promise<string> {
  const html = generateChargeHtml(charge);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;z-index:-9999;opacity:0;pointer-events:none";
  const container = document.createElement("div");
  container.style.width = `${RECEIPT_WIDTH_PX}px`;
  container.style.background = "#fff";
  container.innerHTML = html;
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const receiptEl = (container.querySelector(".receipt") || container) as HTMLElement;
    await waitForReceiptLayout();
    const pageSizeMm = getReceiptPageSizeMm(receiptEl);

    const pdfBlob: Blob = await html2pdf()
      .set({
        margin: [PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM] as [number, number, number, number],
        filename: "recibo.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, width: RECEIPT_WIDTH_PX },
        jsPDF: { unit: "mm", format: [pageSizeMm.width, pageSizeMm.height], orientation: "portrait" },
      })
      .from(receiptEl)
      .outputPdf("blob");

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } finally {
    document.body.removeChild(wrapper);
  }
}

export async function downloadChargePdf(charge: ChargeData) {
  const html = generateChargeHtml(charge);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;z-index:-9999;opacity:0;pointer-events:none";
  const container = document.createElement("div");
  container.style.width = `${RECEIPT_WIDTH_PX}px`;
  container.style.background = "#fff";
  container.innerHTML = html;
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const receiptEl = (container.querySelector(".receipt") || container) as HTMLElement;
    const filename = `recibo-${charge.clientName.replace(/\s+/g, "_").toLowerCase()}.pdf`;
    await waitForReceiptLayout();
    const pageSizeMm = getReceiptPageSizeMm(receiptEl);

    await html2pdf()
      .set({
        margin: [PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM] as [number, number, number, number],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, width: RECEIPT_WIDTH_PX },
        jsPDF: { unit: "mm", format: [pageSizeMm.width, pageSizeMm.height], orientation: "portrait" },
      })
      .from(receiptEl)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
