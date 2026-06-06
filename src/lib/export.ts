export function exportToCsv(data: Record<string, unknown>[], filename: string, columns: { key: string; label: string }[]) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\r\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;bom" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJson(data: Record<string, unknown>[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

import ExcelJS from "exceljs";

export async function exportToExcel(data: Record<string, unknown>[], filename: string, columns: { key: string; label: string }[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Qoyod";
  wb.created = new Date();
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 2, 12) }));
  ws.addRows(data);
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
