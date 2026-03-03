"use client";

import { FileDown, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExportOptions,
  exportToCSV,
  exportToPDF,
  exportToXLSX,
} from "@/lib/report-export";

interface ReportExportButtonsProps {
  options: ExportOptions;
}

export function ReportExportButtons({ options }: ReportExportButtonsProps) {
  const handleExport = (fn: (opts: ExportOptions) => void) => {
    fn(options);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/20 hover:bg-primary/5"
        >
          <FileDown className="mr-2 size-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(exportToPDF)}>
          <FileText className="mr-2 size-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(exportToXLSX)}>
          <FileSpreadsheet className="mr-2 size-4" />
          XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(exportToCSV)}>
          <FileText className="mr-2 size-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
