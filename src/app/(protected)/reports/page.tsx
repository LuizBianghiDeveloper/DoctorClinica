import dayjs from "dayjs";
import {
  BarChart3,
  Cake,
  Calendar,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Target,
  Timer,
  UserMinus,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

const defaultFrom = dayjs().startOf("month").format("YYYY-MM-DD");
const defaultTo = dayjs().endOf("month").format("YYYY-MM-DD");

const REPORTS = {
  financeiro: [
    {
      title: "Faturamento por período",
      description: "Receita bruta (total, mensal, anual)",
      href: `/reports/financeiro/faturamento-periodo?from=${defaultFrom}&to=${defaultTo}`,
      icon: DollarSign,
    },
    {
      title: "Faturamento por profissional",
      description: "Quem mais gera receita",
      href: `/reports/financeiro/faturamento-profissional?from=${defaultFrom}&to=${defaultTo}`,
      icon: DollarSign,
    },
    {
      title: "Faturamento por tipo de consulta",
      description: "Primeira consulta vs retorno vs procedimento",
      href: `/reports/financeiro/faturamento-tipo?from=${defaultFrom}&to=${defaultTo}`,
      icon: DollarSign,
    },
    {
      title: "Receita vs meta",
      description: "Comparar com metas definidas",
      href: `/reports/financeiro/receita-meta?from=${defaultFrom}&to=${defaultTo}`,
      icon: Target,
    },
    {
      title: "Fechamento de comissões",
      description: "Comissões por profissional para pagamento",
      href: `/reports/financeiro/fechamento-comissoes?from=${defaultFrom}&to=${defaultTo}`,
      icon: FileCheck,
    },
  ],
  agendamentos: [
    {
      title: "Ocupação da agenda",
      description: "Percentual de horários preenchidos por profissional",
      href: `/reports/ocupacao?from=${defaultFrom}&to=${defaultTo}`,
      icon: BarChart3,
    },
    {
      title: "Consultas por período",
      description: "Total de agendamentos",
      href: `/reports/agendamentos/consultas-periodo?from=${defaultFrom}&to=${defaultTo}`,
      icon: Calendar,
    },
    {
      title: "Taxa de no-show",
      description: "Percentual de faltas",
      href: `/reports/agendamentos/no-show?from=${defaultFrom}&to=${defaultTo}`,
      icon: UserX,
    },
    {
      title: "Horários mais procurados",
      description: "Dias e horários com mais consultas",
      href: `/reports/agendamentos/horarios-procurados?from=${defaultFrom}&to=${defaultTo}`,
      icon: Clock,
    },
    {
      title: "Tempo médio de consulta",
      description: "Por profissional ou tipo",
      href: `/reports/agendamentos/tempo-medio?from=${defaultFrom}&to=${defaultTo}`,
      icon: Timer,
    },
  ],
  pacientes: [
    {
      title: "Novos pacientes por período",
      description: "Cadastros por mês/ano",
      href: `/reports/pacientes/novos?from=${defaultFrom}&to=${defaultTo}`,
      icon: UserPlus,
    },
    {
      title: "Pacientes mais frequentes",
      description: "Quem mais agenda",
      href: `/reports/pacientes/frequentes?from=${defaultFrom}&to=${defaultTo}`,
      icon: Users,
    },
    {
      title: "Pacientes inativos",
      description: "Sem consulta há X meses",
      href: "/reports/pacientes/inativos?months=6",
      icon: UserMinus,
    },
  ],
  profissionais: [
    {
      title: "Produtividade",
      description: "Consultas por profissional no período",
      href: `/reports/profissionais/produtividade?from=${defaultFrom}&to=${defaultTo}`,
      icon: BarChart3,
    },
    {
      title: "Horários mais utilizados",
      description: "Quando cada profissional atende mais",
      href: `/reports/profissionais/horarios-utilizados?from=${defaultFrom}&to=${defaultTo}`,
      icon: Clock,
    },
  ],
  outros: [
    {
      title: "Aniversariantes",
      description: "Pacientes com aniversário no mês",
      href: "/reports/outros/aniversariantes",
      icon: Cake,
    },
    {
      title: "Tipos de consulta mais realizados",
      description: "Primeiras consultas vs retornos vs procedimentos",
      href: `/reports/outros/tipos-consulta?from=${defaultFrom}&to=${defaultTo}`,
      icon: FileText,
    },
  ],
};

const SECTION_TITLES: Record<string, string> = {
  financeiro: "Financeiro",
  agendamentos: "Agendamentos",
  pacientes: "Pacientes",
  profissionais: "Profissionais",
  outros: "Outros",
};

export default async function ReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Relatórios e indicadores
            </PageTitle>
            <PageDescription>
              Análise de dados e desempenho da clínica
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent className="relative">
          <div className="space-y-10">
            {Object.entries(REPORTS).map(([key, items]) => (
              <section key={key}>
                <h2 className="text-muted-foreground mb-4 text-sm font-medium uppercase tracking-wider">
                  {SECTION_TITLES[key]}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((report) => {
                    const Icon = report.icon;
                    return (
                      <Card
                        key={report.title}
                        className="rounded-2xl border-border/60 shadow-xl shadow-primary/5 transition-shadow hover:shadow-2xl hover:shadow-primary/10"
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
                              <Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-base">
                                {report.title}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {report.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            asChild
                            size="sm"
                            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                          >
                            <Link href={report.href}>
                              <BarChart3 className="mr-2 size-4" />
                              Ver relatório
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
