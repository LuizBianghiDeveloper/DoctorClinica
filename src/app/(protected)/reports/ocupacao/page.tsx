import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { ArrowLeft, BarChart3 } from "lucide-react";
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
import { getScheduleOccupancyReport } from "@/data/get-schedule-occupancy-report";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportExportButtons } from "../_components/report-export-buttons";
import { OccupancyReportDatePicker } from "./_components/occupancy-report-date-picker";

interface OcupacaoPageProps {
  searchParams: Promise<{ from?: string; to?: string; doctorId?: string }>;
}

export default async function OcupacaoReportPage({
  searchParams,
}: OcupacaoPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to =
    params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");
  const doctorId = params.doctorId;

  const [report, doctors] = await Promise.all([
    getScheduleOccupancyReport(
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

  const doctorsForFilter = doctors.map((d) => ({ id: d.id, name: d.name }));

  const exportData = report.map((row) => ({
    profissional: row.doctorName,
    especialidade: row.specialty,
    horariosDisponiveis: row.totalSlots,
    horariosOcupados: row.filledSlots,
    ocupacao: `${row.occupancyPercent}%`,
  }));

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
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
                <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
                  Ocupação da agenda
                </PageTitle>
                <PageDescription>
                  Percentual de horários preenchidos por profissional no período
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <OccupancyReportDatePicker
            defaultFrom={from}
            defaultTo={to}
            doctorId={doctorId}
            doctors={doctorsForFilter}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-muted-foreground size-5" />
                  <CardTitle>Resultados por profissional</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Ocupação da agenda",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      { key: "profissional", header: "Profissional" },
                      { key: "especialidade", header: "Especialidade" },
                      { key: "horariosDisponiveis", header: "Horários disponíveis" },
                      { key: "horariosOcupados", header: "Horários ocupados" },
                      { key: "ocupacao", header: "Ocupação" },
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
                    <TableHead>Profissional</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead className="text-right">
                      Horários disponíveis
                    </TableHead>
                    <TableHead className="text-right">Horários ocupados</TableHead>
                    <TableHead className="text-right">Ocupação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground text-center py-8"
                      >
                        Nenhum dado encontrado para o período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.map((row) => (
                      <TableRow key={row.doctorId}>
                        <TableCell className="font-medium">
                          {row.doctorName}
                        </TableCell>
                        <TableCell>{row.specialty}</TableCell>
                        <TableCell className="text-right">
                          {row.totalSlots}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.filledSlots}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              row.occupancyPercent >= 70
                                ? "text-green-600 font-medium"
                                : row.occupancyPercent >= 40
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                            }
                          >
                            {row.occupancyPercent}%
                          </span>
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
