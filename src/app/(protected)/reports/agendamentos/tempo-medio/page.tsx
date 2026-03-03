import dayjs from "dayjs";
import { ArrowLeft, Timer } from "lucide-react";
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
import { getAverageConsultationTimeReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    groupBy?: string;
  }>;
}

export default async function TempoMedioPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");
  const groupBy = (params.groupBy ?? "doctor") as "doctor" | "type";

  const data = await getAverageConsultationTimeReport(
    session.user.clinic.id,
    from,
    to,
    groupBy,
  );

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const exportData = data.map((row) => ({
    item: "doctorName" in row ? row.doctorName : row.typeName ?? "Sem tipo",
    consultas: row.count,
    tempoMedio: formatMinutes(Number(row.avgMinutes)),
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
                  Tempo médio de consulta
                </PageTitle>
                <PageDescription>
                  Por profissional ou tipo de consulta
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/agendamentos/tempo-medio"
            defaultFrom={from}
            defaultTo={to}
            showGroupBy
            groupBy={groupBy}
            groupByOptions={[
              { value: "doctor", label: "Por profissional" },
              { value: "type", label: "Por tipo de consulta" },
            ]}
          />
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Timer className="text-muted-foreground size-5" />
                  <CardTitle>
                    {groupBy === "doctor" ? "Por profissional" : "Por tipo"}
                  </CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Tempo médio de consulta",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      {
                        key: "item",
                        header:
                          groupBy === "doctor" ? "Profissional" : "Tipo",
                      },
                      { key: "consultas", header: "Consultas" },
                      { key: "tempoMedio", header: "Tempo médio" },
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
                    <TableHead>
                      {groupBy === "doctor" ? "Profissional" : "Tipo"}
                    </TableHead>
                    <TableHead className="text-right">Consultas</TableHead>
                    <TableHead className="text-right">Tempo médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum dado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow
                        key={
                          "doctorId" in row
                            ? row.doctorId
                            : row.typeId ?? "sem-tipo"
                        }
                      >
                        <TableCell className="font-medium">
                          {"doctorName" in row
                            ? row.doctorName
                            : row.typeName ?? "Sem tipo"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMinutes(Number(row.avgMinutes))}
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
