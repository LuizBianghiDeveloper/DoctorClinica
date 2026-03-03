import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { Stethoscope } from "lucide-react";

import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

const DoctorsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session!.user.clinic!.id),
    with: { availability: true, specialties: true },
  });
  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Profissionais
            </PageTitle>
            <PageDescription>
              Gerencie os profissionais da sua clínica
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <AddDoctorButton />
          </PageActions>
        </PageHeader>
        <PageContent>
          {doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20">
                <Stethoscope className="text-muted-foreground size-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Nenhum profissional cadastrado</h3>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                Comece adicionando o primeiro profissional da sua clínica para gerenciar agendamentos e horários.
              </p>
              <AddDoctorButton />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default DoctorsPage;
