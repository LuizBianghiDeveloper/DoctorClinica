import dayjs from "dayjs";
import { ArrowLeft, Target } from "lucide-react";
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
import { getRevenueVsGoalReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ReportDatePicker } from "../../_components/report-date-picker";
import { ReportExportButtons } from "../../_components/report-export-buttons";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReceitaMetaPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const from =
    params.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = params.to ?? dayjs().endOf("month").format("YYYY-MM-DD");

  const { totalRevenue, goals } = await getRevenueVsGoalReport(
    session.user.clinic.id,
    from,
    to,
  );

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);

  const exportData = goals.map((g) => {
    const target = g.targetInCents;
    const pct =
      target > 0 ? Math.round((totalRevenue / target) * 100) : 0;
    return {
      periodo: g.periodRef,
      tipo:
        g.periodType === "monthly"
          ? "Mensal"
          : g.periodType === "quarterly"
            ? "Trimestral"
            : "Anual",
      meta: formatCurrency(target),
      status: `${pct}%`,
    };
  });

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
                  Receita vs meta
                </PageTitle>
                <PageDescription>
                  Comparação com metas definidas
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
          <ReportDatePicker
            basePath="/reports/financeiro/receita-meta"
            defaultFrom={from}
            defaultTo={to}
          />
        </PageHeader>
        <PageContent className="relative">
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="text-muted-foreground size-5" />
                    <CardTitle>Resumo</CardTitle>
                  </div>
                  {exportData.length > 0 && (
                    <ReportExportButtons
                      options={{
                        title: "Receita vs meta",
                        subtitle: `Receita: ${formatCurrency(totalRevenue)} | Período: ${dayjs(from).format("DD/MM/YYYY")} a ${dayjs(to).format("DD/MM/YYYY")}`,
                        columns: [
                          { key: "periodo", header: "Período" },
                          { key: "tipo", header: "Tipo" },
                          { key: "meta", header: "Meta" },
                          { key: "status", header: "Status" },
                        ],
                        data: exportData,
                      }}
                    />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  Período: {dayjs(from).format("DD/MM/YYYY")} a{" "}
                  {dayjs(to).format("DD/MM/YYYY")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Receita realizada
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {goals.length > 0 && (
              <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle>Metas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Período</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Meta</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goals.map((g) => {
                          const target = g.targetInCents;
                          const pct =
                            target > 0
                              ? Math.round((totalRevenue / target) * 100)
                              : 0;
                          return (
                            <TableRow key={g.id}>
                              <TableCell>{g.periodRef}</TableCell>
                              <TableCell>
                                {g.periodType === "monthly"
                                  ? "Mensal"
                                  : g.periodType === "quarterly"
                                    ? "Trimestral"
                                    : "Anual"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(target)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={
                                    pct >= 100
                                      ? "text-green-600 font-medium"
                                      : pct >= 70
                                        ? "text-amber-600"
                                        : "text-muted-foreground"
                                  }
                                >
                                  {pct}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
            )}
            {goals.length === 0 && (
              <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma meta cadastrada. Configure metas em Configurações para
                  acompanhar o desempenho.
                </CardContent>
              </Card>
            )}
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
