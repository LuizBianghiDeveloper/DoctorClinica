import dayjs from "dayjs";
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
import { getDoctorProductivityReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportBarChart } from "../../_components/report-bar-chart";
import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";
import { ReportPieChart } from "../../_components/report-pie-chart";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ProdutividadePage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");

  const data = await getDoctorProductivityReport(
    session.user.clinic.id,
    from,
    to,
  );

  const exportData = data.map((row) => ({
    profissional: row.doctorName,
    especialidade: row.specialty ?? "-",
    consultas: row.count,
    receita: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(row.revenue) / 100),
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
                  Produtividade
                </PageTitle>
                <PageDescription>
                  Consultas por profissional no período
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/profissionais/produtividade"
            defaultFrom={from}
            defaultTo={to}
          />
        </PageHeader>
        <PageContent className="relative">
          {data.length > 0 && (
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">
                    Consultas por profissional (pizza)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={data.map((row) => ({
                      name: row.doctorName,
                      value: row.count,
                    }))}
                    config={{
                      count: { label: "Consultas", color: "var(--chart-1)" },
                    }}
                    format="count"
                  />
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">
                    Consultas por profissional (barras)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportBarChart
                    data={data.map((row) => ({
                      name: row.doctorName,
                      value: row.count,
                    }))}
                    config={{
                      count: { label: "Consultas", color: "var(--chart-2)" },
                    }}
                    format="count"
                  />
                </CardContent>
              </Card>
            </div>
          )}
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-muted-foreground size-5" />
                  <CardTitle>Comparativo de desempenho</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Produtividade por profissional",
                    subtitle: `Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                    columns: [
                      { key: "profissional", header: "Profissional" },
                      { key: "especialidade", header: "Especialidade" },
                      { key: "consultas", header: "Consultas" },
                      { key: "receita", header: "Receita" },
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
                    <TableHead className="text-right">Consultas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
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
                      <TableRow key={row.doctorId}>
                        <TableCell className="font-medium">
                          {row.doctorName}
                        </TableCell>
                        <TableCell>{row.specialty ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(row.revenue) / 100)}
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
