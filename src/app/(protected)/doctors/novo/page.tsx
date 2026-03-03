import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import WithAuthentication from "@/hocs/with-authentication";

import UpsertDoctorForm from "../_components/upsert-doctor-form";

export default function NovoDoctorPage() {
  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Novo profissional
            </PageTitle>
            <PageDescription>
              Cadastre um profissional e defina os horários de atendimento por dia da semana.
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent>
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/doctors">← Voltar aos profissionais</Link>
            </Button>
          </div>
          <div className="w-full rounded-2xl border border-border/50 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <UpsertDoctorForm variant="page" />
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
