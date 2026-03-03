import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  header: string;
}

export interface ExportOptions {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title: string;
  subtitle?: string;
  filename?: string;
}

function sanitizeFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/gi, "_");
}

function getFilename(title: string, format: string) {
  const base = sanitizeFilename(title);
  const date = new Date().toISOString().slice(0, 10);
  return `${base}_${date}.${format}`;
}

export function exportToCSV(options: ExportOptions) {
  const { columns, data, title, filename } = options;
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (val == null) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }),
  );
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? getFilename(title, "csv");
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToXLSX(options: ExportOptions) {
  const { columns, data, title, subtitle, filename } = options;
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => row[col.key] ?? ""),
  );
  const wsData = subtitle
    ? [[title], [subtitle], [], headers, ...rows]
    : [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = columns.map((_, i) => ({
    wch: Math.max(
      10,
      ...rows.map((r) => String(r[i] ?? "").length),
      (headers[i]?.length ?? 0) + 2,
    ),
  }));
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, filename ?? getFilename(title, "xlsx"));
}

export function exportToPDF(options: ExportOptions) {
  const { columns, data, title, subtitle, filename } = options;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 28);
    doc.setTextColor(0, 0, 0);
  }

  const startY = subtitle ? 35 : 28;
  const tableHeaders = columns.map((c) => c.header);
  const tableData = data.map((row) =>
    columns.map((col) => String(row[col.key] ?? "")),
  );

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY,
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  doc.save(filename ?? getFilename(title, "pdf"));
}
