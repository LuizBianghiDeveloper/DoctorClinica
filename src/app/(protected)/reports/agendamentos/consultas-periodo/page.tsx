import dayjs from "dayjs";
import { ArrowLeft, Calendar } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { getAppointmentsByPeriodReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; groupBy?: string }>;
}

export default async function ConsultasPeriodoPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");
  const groupBy = (params.groupBy ?? "day") as "day" | "week" | "month";

  const data = await getAppointmentsByPeriodReport(
    session.user.clinic.id,
    from,
    to,
    groupBy,
  );

  const formatPeriod = (period: string | Date) => {
    const d = dayjs(period);
    if (groupBy === "day") return d.format("DD/MM/YYYY");
    if (groupBy === "week") return `Semana ${d.format("DD/MM")}`;
    return d.format("MMM/YYYY");
  };

  const exportData = data.map((row) => ({
    periodo: formatPeriod(row.period),
    total: row.total,
    realizadas: row.completed,
    faltas: row.noShow,
    canceladas: row.cancelled,
  }));

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/20 hover:bg-primary/5"
                asChild
              >
                <Link href="/reports">
                  <ArrowLeft className="mr-2 size-4" />
                  Relatórios
                </Link>
              </Button>
              <div>
                <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Consultas por período
                </PageTitle>
                <PageDescription>
                  Total de agendamentos
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/agendamentos/consultas-periodo"
            defaultFrom={from}
            defaultTo={to}
            showGroupBy
            groupBy={groupBy}
            groupByOptions={[
              { value: "day", label: "Por dia" },
              { value: "week", label: "Por semana" },
              { value: "month", label: "Por mês" },
            ]}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground size-5" />
                  <CardTitle>Resultados</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Consultas por período",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      { key: "periodo", header: "Período" },
                      { key: "total", header: "Total" },
                      { key: "realizadas", header: "Realizadas" },
                      { key: "faltas", header: "Faltas" },
                      { key: "canceladas", header: "Canceladas" },
                    ],
                    data: exportData,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Período: {dayjs(from).format("DD/MM/YYYY")} a{" "}
                {dayjs(to).format("DD/MM/YYYY")}
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Realizadas</TableHead>
                    <TableHead className="text-right">Faltas</TableHead>
                    <TableHead className="text-right">Canceladas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum dado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={String(row.period)}>
                        <TableCell className="font-medium">
                          {formatPeriod(row.period)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.total}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.completed}
                        </TableCell>
                        <TableCell className="text-right">{row.noShow}</TableCell>
                        <TableCell className="text-right">
                          {row.cancelled}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
