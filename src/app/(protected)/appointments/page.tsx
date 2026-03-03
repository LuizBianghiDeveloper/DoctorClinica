import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Suspense } from "react";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getAppointmentTypes } from "@/data/get-appointment-types";
import { getRooms } from "@/data/get-rooms";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { AppointmentsDoctorFilter } from "./_components/appointments-doctor-filter";
import { AppointmentsView } from "./_components/appointments-view";
import { appointmentsTableColumns } from "./_components/table-columns";

interface AppointmentsPageProps {
  searchParams: Promise<{ doctorId?: string }>;
}

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { doctorId: doctorIdParam } = await searchParams;

  const [patients, doctors, appointments, appointmentTypes, rooms] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session!.user.clinic!.id),
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session!.user.clinic!.id),
      with: { availability: true, specialties: true },
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, session!.user.clinic!.id),
      with: {
        patient: true,
        doctor: { with: { specialties: true } },
        appointmentType: true,
        room: true,
      },
    }),
    getAppointmentTypes(session!.user.clinic!.id),
    getRooms(session!.user.clinic!.id),
  ]);

  const filteredAppointments = doctorIdParam
    ? appointments.filter((a) => a.doctorId === doctorIdParam)
    : appointments;

  const doctorsForFilter = doctors.map((d) => ({ id: d.id, name: d.name }));

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Agendamentos
            </PageTitle>
            <PageDescription>
              Gerencie os agendamentos da sua clínica
            </PageDescription>
          </PageHeaderContent>
          <PageActions className="flex flex-wrap items-center gap-2">
            <AppointmentsDoctorFilter
              doctors={doctorsForFilter}
              selectedDoctorId={doctorIdParam ?? null}
            />
            <AddAppointmentButton
              patients={patients}
              doctors={doctors}
              appointmentTypes={appointmentTypes}
              rooms={rooms}
            />
          </PageActions>
        </PageHeader>
        <PageContent className="relative">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-2xl border border-border/60 bg-muted/30 shadow-sm" />
            }
          >
            <AppointmentsView
              appointments={filteredAppointments}
              doctors={doctorsForFilter}
              columns={appointmentsTableColumns}
            />
          </Suspense>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default AppointmentsPage;
