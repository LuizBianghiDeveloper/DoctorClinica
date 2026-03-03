import dayjs from "dayjs";
import { ArrowLeft, Users } from "lucide-react";
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
import { getMostFrequentPatientsReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function PacientesFrequentesPage({
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

  const data = await getMostFrequentPatientsReport(
    session.user.clinic.id,
    from,
    to,
    20,
  );

  const exportData = data.map((row) => ({
    paciente: row.patientName,
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
                  Pacientes mais frequentes
                </PageTitle>
                <PageDescription>
                  Quem mais agenda consultas
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/pacientes/frequentes"
            defaultFrom={from}
            defaultTo={to}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="text-muted-foreground size-5" />
                  <CardTitle>Top 20</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Pacientes mais frequentes",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      { key: "paciente", header: "Paciente" },
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
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right">Consultas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum dado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.patientId}>
                        <TableCell className="font-medium">
                          {row.patientName}
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
