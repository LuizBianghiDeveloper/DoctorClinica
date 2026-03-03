import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDoctor } from "@/data/get-doctor";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { DoctorTimeBlocksForm } from "../../_components/doctor-time-blocks-form";
import UpsertDoctorForm from "../../_components/upsert-doctor-form";

interface EditarDoctorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarDoctorPage({ params }: EditarDoctorPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const clinicId = session?.user?.clinic?.id;
  if (!clinicId) notFound();
  const { id: doctorId } = await params;
  const doctor = await getDoctor({ doctorId, clinicId });
  if (!doctor) notFound();

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Editar profissional
            </PageTitle>
            <PageDescription>
              Altere as informações e horários de atendimento de {doctor.name}.
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
          <div className="space-y-6">
            <div className="w-full rounded-2xl border border-border/50 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <UpsertDoctorForm doctor={doctor} variant="page" />
            </div>
            <div className="w-full rounded-2xl border border-border/50 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <DoctorTimeBlocksForm
                doctorId={doctor.id}
                timeBlocks={doctor.timeBlocks ?? []}
              />
            </div>
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
