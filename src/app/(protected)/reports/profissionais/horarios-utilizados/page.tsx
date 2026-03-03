import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { ArrowLeft, Clock } from "lucide-react";
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
import { getDoctorPeakHoursReport } from "@/data/get-reports";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

const WEEKDAYS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; doctorId?: string }>;
}

export default async function HorariosUtilizadosPage({
  searchParams,
}: PageProps) {
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

  const [data, doctors] = await Promise.all([
    getDoctorPeakHoursReport(
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

  const exportData = data.map((row) => ({
    profissional: row.doctorName,
    dia: WEEKDAYS[Number(row.weekDay)] ?? "-",
    horario: `${String(Number(row.hour)).padStart(2, "0")}:00`,
    consultas: row.count,
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
                  Horários mais utilizados
                </PageTitle>
                <PageDescription>
                  Quando cada profissional atende mais
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/profissionais/horarios-utilizados"
            defaultFrom={from}
            defaultTo={to}
            doctorId={doctorId}
            doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="text-muted-foreground size-5" />
                  <CardTitle>Resultados</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Horários mais utilizados por profissional",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      { key: "profissional", header: "Profissional" },
                      { key: "dia", header: "Dia" },
                      { key: "horario", header: "Horário" },
                      { key: "consultas", header: "Consultas" },
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
                    <TableHead>Dia</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Consultas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum dado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={`${row.doctorId}-${row.weekDay}-${row.hour}`}>
                        <TableCell className="font-medium">
                          {row.doctorName}
                        </TableCell>
                        <TableCell>
                          {WEEKDAYS[Number(row.weekDay)] ?? "-"}
                        </TableCell>
                        <TableCell>
                          {String(Number(row.hour)).padStart(2, "0")}:00
                        </TableCell>
                        <TableCell className="text-right">
                          {row.count}
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
