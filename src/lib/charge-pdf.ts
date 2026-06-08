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

// Inline SVG logo forced to black
const logoSvg = `<svg width="180" height="30" viewBox="0 0 488 79" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 76.7857V16.0234H20.8343C37.5903 16.0234 51.7388 29.6518 51.7388 46.4078C51.7388 63.1638 37.5903 76.7922 20.8343 76.7922H0V76.7857ZM7.80964 69.0596H20.8278C33.1524 69.0596 43.3961 58.8994 43.3961 46.4014C43.3961 33.9034 33.1524 23.8331 20.8278 23.8331H7.80964V69.0596Z" fill="#000"/>
<path d="M69.5274 23.3972V42.7607H99.3915V50.0501H69.5274V69.4072H104.253V76.7866H61.7178V16.0178H104.253V23.3972H69.5274Z" fill="#000"/>
<path d="M151.641 54.8217C154.332 64.1984 158.931 71.5777 164.75 76.7863H154.769C150.428 71.4878 146.78 64.4617 144.269 56.0355C131.507 56.0355 123.518 60.5505 121.957 74.1788V76.7799H114.314V16.1011H144.872C155.899 16.1011 164.75 25.041 164.75 36.0683C164.75 44.1413 159.978 51.1738 153.029 54.2951L151.641 54.8153V54.8217ZM144.962 48.6626C151.905 48.6626 157.46 42.9339 157.46 36.0747C157.46 29.2156 151.731 23.4868 144.872 23.4868H121.957V56.042C125.515 53.2675 126.299 52.8308 127.076 52.4839C133.672 48.6626 141.398 48.6626 144.956 48.6626" fill="#000"/>
<path d="M238.015 16.0178V76.7866H230.289V32.1637L227.162 38.3292L209.975 74.9626H202.333L182.108 31.7334V76.7866H174.299V16.0178H183.065L206.244 65.6758L229.249 16.0178H238.015Z" fill="#000"/>
<path d="M352.244 76.7866H309.708V16.0178H317.518V69.4072H352.244V76.7866Z" fill="#000"/>
<path d="M410.571 57.9497C410.571 69.0604 399.544 78.0903 385.916 78.0903C372.288 78.0903 361.087 69.0604 361.087 57.9497V16.0178H368.897V57.2496C368.897 63.8454 376.706 69.8375 385.909 69.8375C395.113 69.8375 402.749 63.8454 402.749 57.2496V16.0178H410.559V57.9497H410.571Z" fill="#000"/>
<path d="M488 16.0178V76.7866H480.28V32.1637L477.152 38.3292L459.96 74.9626H452.323L432.099 31.7334V76.7866H424.283V16.0178H433.05L456.228 65.6758L479.233 16.0178H488Z" fill="#000"/>
<path d="M292.957 76.7877H301.03L277.942 14.7217H269.689L246.69 76.7877H254.757L260.107 62.4465L263.016 54.4763H263.01L273.857 25.3122L284.711 54.4763H284.698L287.608 62.4465L292.957 76.7877Z" fill="#000"/>
<path d="M399.7 0H371.968V6.76278H399.7V0Z" fill="#000"/>
</svg>`;

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
    : logoSvg
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
