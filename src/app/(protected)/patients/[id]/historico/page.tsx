import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getPatientHistory } from "@/data/get-patient-history";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { PatientHistoryContent } from "./_components/patient-history-content";

interface PatientHistoricoPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientHistoricoPage({ params }: PatientHistoricoPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const clinicId = session?.user?.clinic?.id;
  if (!clinicId) {
    notFound();
  }
  const { id: patientId } = await params;
  const { patient, appointments } = await getPatientHistory({ patientId, clinicId });
  if (!patient) {
    notFound();
  }

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Histórico de consultas
            </PageTitle>
            <PageDescription>
              Todas as consultas de {patient.name} na clínica, com anotações dos profissionais.
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent>
          <PatientHistoryContent
            patientId={patient.id}
            patientName={patient.name}
            allergiesRestrictions={patient.allergiesRestrictions}
            initialAppointments={appointments}
          />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
}
