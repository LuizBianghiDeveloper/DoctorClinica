"use client";

import dayjs from "dayjs";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";
import { toast } from "sonner";

import { getAuditLogsExportAction } from "@/actions/get-audit-logs-export";
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

type ExportFn = (opts: ExportOptions) => void;

interface AuditExportFullButtonProps {
  from: string;
  to: string;
  title?: string;
}

export function AuditExportFullButton({
  from,
  to,
  title = "Relatório de Auditoria",
}: AuditExportFullButtonProps) {
  const exportFnRef = useRef<ExportFn | null>(null);

  const action = useAction(getAuditLogsExportAction, {
    onSuccess: ({ data }) => {
      if (data && exportFnRef.current) {
        const opts: ExportOptions = {
          title,
          subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
          columns: [
            { key: "data", header: "Data / Hora" },
            { key: "alteracao", header: "Alteração" },
            { key: "usuario", header: "Usuário" },
          ],
          data,
        };
        exportFnRef.current(opts);
        exportFnRef.current = null;
      }
    },
    onError: () => {
      toast.error("Erro ao exportar auditoria.");
      exportFnRef.current = null;
    },
  });

  const handleFormat = (fn: ExportFn) => {
    exportFnRef.current = fn;
    action.execute({ from, to });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/20 hover:bg-primary/5"
          disabled={action.isPending}
        >
          <FileDown className="mr-2 size-4" />
          {action.isPending ? "Exportando..." : "Exportar período completo"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleFormat(exportToPDF)}>
          <FileText className="mr-2 size-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFormat(exportToXLSX)}>
          <FileSpreadsheet className="mr-2 size-4" />
          XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFormat(exportToCSV)}>
          <FileText className="mr-2 size-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
