import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function addSheet(wb: ExcelJS.Workbook, name: string, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const ws = wb.addWorksheet(name.substring(0, 31));
  const cols = Object.keys(data[0]);
  ws.columns = cols.map((key) => ({ header: key, key, width: 20 }));
  // Bold header row
  ws.getRow(1).font = { bold: true };
  data.forEach((row) => ws.addRow(row));
}

export async function exportToXls(sheetName: string, data: Record<string, unknown>[]) {
  const wb = new ExcelJS.Workbook();
  addSheet(wb, sheetName, data);
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${sheetName}.xlsx`);
}

export async function exportMultiSheetXls(
  fileName: string,
  sheets: { name: string; data: Record<string, unknown>[] }[]
): Promise<boolean> {
  const wb = new ExcelJS.Workbook();
  sheets.forEach((s) => addSheet(wb, s.name, s.data));
  if (wb.worksheets.length === 0) return false;
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
  return true;
}

export function exportToPdf() {
  window.print();
}
