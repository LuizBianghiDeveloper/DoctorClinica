import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { ArrowLeft, UserX } from "lucide-react";
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
import { getNoShowRateReport } from "@/data/get-reports";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; doctorId?: string }>;
}

export default async function NoShowPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");
  const doctorId = params.doctorId;

  const [report, doctors] = await Promise.all([
    getNoShowRateReport(
      session.user.clinic.id,
      from,
      to,
      doctorId,
    ),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic!.id),
      columns: { id: true, name: true },
    }),
  ]);

  const summary = report.summary;
  const total = Number(summary?.total ?? 0);
  const noShow = Number(summary?.noShow ?? 0);
  const rate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  const exportData = report.byDoctor.map((row) => {
    const rowRate =
      row.total > 0 ? Math.round((row.noShow / row.total) * 100) : 0;
    return {
      profissional: row.doctorName,
      total: row.total,
      faltas: row.noShow,
      taxa: `${rowRate}%`,
    };
  });

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
                  Taxa de no-show
                </PageTitle>
                <PageDescription>
                  Percentual de faltas (precisa registrar status)
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/agendamentos/no-show"
            defaultFrom={from}
            defaultTo={to}
            doctorId={doctorId}
            doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
          />
        </PageHeader>
        <PageContent className="relative">
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserX className="text-muted-foreground size-5" />
                  <CardTitle>Resumo geral</CardTitle>
                </div>
                <p className="text-muted-foreground text-sm">
                  Período: {dayjs(from).format("DD/MM/YYYY")} a{" "}
                  {dayjs(to).format("DD/MM/YYYY")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Total</p>
                    <p className="text-2xl font-bold">{total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Faltas</p>
                    <p className="text-2xl font-bold text-amber-600">{noShow}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Taxa de no-show</p>
                    <p
                      className={`text-2xl font-bold ${
                        rate >= 20 ? "text-red-600" : rate >= 10 ? "text-amber-600" : "text-green-600"
                      }`}
                    >
                      {rate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Por profissional</CardTitle>
                  <ReportExportButtons
                    options={{
                      title: "Taxa de no-show",
                      subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")} | Total: ${total} | Faltas: ${noShow} | Taxa: ${rate}%`,
                      columns: [
                        { key: "profissional", header: "Profissional" },
                        { key: "total", header: "Total" },
                        { key: "faltas", header: "Faltas" },
                        { key: "taxa", header: "Taxa" },
                      ],
                      data: exportData,
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byDoctor.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-muted-foreground py-8 text-center"
                        >
                          Nenhum dado encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.byDoctor.map((row) => {
                        const rowRate =
                          row.total > 0
                            ? Math.round((row.noShow / row.total) * 100)
                            : 0;
                        return (
                          <TableRow key={row.doctorId}>
                            <TableCell className="font-medium">
                              {row.doctorName}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.total}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.noShow}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  rowRate >= 20
                                    ? "text-red-600 font-medium"
                                    : rowRate >= 10
                                      ? "text-amber-600"
                                      : "text-green-600"
                                }
                              >
                                {rowRate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
