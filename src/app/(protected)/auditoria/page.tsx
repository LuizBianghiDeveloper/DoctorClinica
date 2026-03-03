import dayjs from "dayjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLogsPaginated } from "@/data/get-audit-logs";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportExportButtons } from "../reports/_components/report-export-buttons";
import { AuditDatePicker } from "./_components/audit-date-picker";
import { AuditExportFullButton } from "./_components/audit-export-full-button";
import { AuditPagination } from "./_components/audit-pagination";

const PAGE_SIZE = 20;

interface AuditoriaPageProps {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>;
}

const AuditoriaPage = async ({ searchParams }: AuditoriaPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const isAdmin = (session.user as { role?: string }).role === "admin";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");

  const { logs, totalCount, totalPages } = await getAuditLogsPaginated(
    session.user.clinic.id,
    currentPage,
    PAGE_SIZE,
    from,
    to,
  );

  const exportData = logs.map((log) => ({
    data: dayjs(log.createdAt).format("DD/MM/YYYY HH:mm"),
    alteracao: log.action,
    usuario: log.userName?.trim() || log.userEmail,
  }));

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <div>
              <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
                Auditoria
              </PageTitle>
              <PageDescription>
                Histórico de alterações realizadas no sistema
              </PageDescription>
            </div>
            <Suspense
              fallback={
                <div className="h-11 w-[240px] animate-pulse rounded-xl border border-border/60 bg-muted/30" />
              }
            >
              <AuditDatePicker
                basePath="/auditoria"
                defaultFrom={from}
                defaultTo={to}
              />
            </Suspense>
          </PageHeaderContent>
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Registro de alterações</CardTitle>
                <div className="flex items-center gap-2">
                  <ReportExportButtons
                    options={{
                      title: "Relatório de Auditoria",
                      subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")} (página atual)`,
                      columns: [
                        { key: "data", header: "Data / Hora" },
                        { key: "alteracao", header: "Alteração" },
                        { key: "usuario", header: "Usuário" },
                      ],
                      data: exportData,
                    }}
                  />
                  <AuditExportFullButton from={from} to={to} />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Período: {dayjs(from).format("DD/MM/YYYY")} a{" "}
                {dayjs(to).format("DD/MM/YYYY")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Alteração</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground py-12 text-center"
                      >
                        Nenhum registro de auditoria no período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          {log.userName?.trim() || log.userEmail}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <AuditPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                from={from}
                to={to}
              />
            </CardContent>
          </Card>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default AuditoriaPage;
