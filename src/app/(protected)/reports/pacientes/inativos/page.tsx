import dayjs from "dayjs";
import { ArrowLeft, UserMinus } from "lucide-react";
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
import { getInactivePatientsReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{ months?: string }>;
}

export default async function PacientesInativosPage({
  searchParams,
}: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const months = parseInt(params.months ?? "6", 10);

  const data = await getInactivePatientsReport(
    session.user.clinic.id,
    months,
  );

  const exportData = data.map((row) => ({
    paciente: row.patientName,
    ultimaConsulta: row.lastAppointment
      ? dayjs(row.lastAppointment).format("DD/MM/YYYY")
      : "Nunca consultou",
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
                  Pacientes inativos
                </PageTitle>
                <PageDescription>
                  Sem consulta há X meses
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/pacientes/inativos"
            defaultFrom={dayjs().subtract(months, "month").format("YYYY-MM-DD")}
            defaultTo={dayjs().format("YYYY-MM-DD")}
            monthsInactive={months}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserMinus className="text-muted-foreground size-5" />
                  <CardTitle>Resultados</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Pacientes inativos",
                    subtitle: `Sem consulta há ${months} meses ou mais`,
                    columns: [
                      { key: "paciente", header: "Paciente" },
                      { key: "ultimaConsulta", header: "Última consulta" },
                    ],
                    data: exportData,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Pacientes sem consulta há {months} meses ou mais
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Última consulta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum paciente inativo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.patientId}>
                        <TableCell className="font-medium">
                          {row.patientName}
                        </TableCell>
                        <TableCell>
                          {row.lastAppointment
                            ? dayjs(row.lastAppointment).format("DD/MM/YYYY")
                            : "Nunca consultou"}
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
