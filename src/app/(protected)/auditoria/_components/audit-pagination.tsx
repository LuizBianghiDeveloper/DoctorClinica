"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AuditPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  from?: string;
  to?: string;
}

export function AuditPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  from,
  to,
}: AuditPaginationProps) {
  if (totalCount === 0) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (from?.trim()) params.set("from", from.trim());
    if (to?.trim()) params.set("to", to.trim());
    return `/auditoria?${params.toString()}`;
  };

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm">
        Mostrando {start} a {end} de {totalCount} registro
        {totalCount !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        {currentPage <= 1 ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-primary/20"
            disabled
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-primary/20 hover:bg-primary/5"
            asChild
          >
            <Link
              href={buildHref(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
        <span className="text-muted-foreground min-w-[6rem] text-center text-sm">
          Página {currentPage} de {totalPages}
        </span>
        {currentPage >= totalPages ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-primary/20"
            disabled
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-primary/20 hover:bg-primary/5"
            asChild
          >
            <Link
              href={buildHref(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
