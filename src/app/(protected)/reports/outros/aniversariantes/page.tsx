import dayjs from "dayjs";
import { ArrowLeft, Cake } from "lucide-react";
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
import { getBirthdaysReport } from "@/data/get-reports";
import WithAuthentication from "@/hocs/with-authentication";
import { ReportExportButtons } from "../../_components/report-export-buttons";
import { auth } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function AniversariantesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const params = await searchParams;
  const now = dayjs();
  const month = parseInt(params.month ?? String(now.month() + 1), 10);
  const year = parseInt(params.year ?? String(now.year()), 10);

  const data = await getBirthdaysReport(session.user.clinic.id, month);

  const exportData = data.map((row) => ({
    paciente: row.name,
    data: row.birthDate
      ? dayjs(row.birthDate).format("DD/MM")
      : "-",
    telefone: row.phoneNumber ?? "-",
  }));

  const formatBirthDate = (d: string | Date | null) => {
    if (!d) return "-";
    const dt = dayjs(d);
    return dt.format("DD/MM");
  };

  const formatPhoneForWhatsApp = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) {
      const withCountry = digits.length === 11 && digits.startsWith("0")
        ? "55" + digits.slice(1)
        : digits.length === 10
          ? "55" + digits
          : digits;
      return `https://wa.me/${withCountry}`;
    }
    return null;
  };

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
                  Aniversariantes
                </PageTitle>
                <PageDescription>
                  Pacientes com aniversário no mês
                </PageDescription>
              </div>
            </div>
          </PageHeaderContent>
        </PageHeader>
        <PageContent className="relative">
          <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cake className="text-muted-foreground size-5" />
                  <CardTitle>{MONTHS[month - 1]} {year}</CardTitle>
                </div>
                <ReportExportButtons
                  options={{
                    title: "Aniversariantes",
                    subtitle: `${MONTHS[month - 1]} ${year} - ${data.length} aniversariante(s)`,
                    columns: [
                      { key: "paciente", header: "Paciente" },
                      { key: "data", header: "Data" },
                      { key: "telefone", header: "Telefone" },
                    ],
                    data: exportData,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {data.length} aniversariante(s) no mês
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground py-8 text-center"
                      >
                        Nenhum aniversariante neste mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => {
                      const waUrl = formatPhoneForWhatsApp(row.phoneNumber);
                      const message = encodeURIComponent(
                        `Feliz aniversário, ${row.name}! 🎂 Parabéns!`,
                      );
                      const fullWaUrl = waUrl
                        ? `${waUrl}?text=${message}`
                        : null;
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell>
                            {formatBirthDate(row.birthDate)}
                          </TableCell>
                          <TableCell>{row.phoneNumber ?? "-"}</TableCell>
                          <TableCell>
                            {fullWaUrl && (
                              <a
                                href={fullWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                                aria-label="Enviar parabéns no WhatsApp"
                              >
                                <svg
                                  className="size-5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.885-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
