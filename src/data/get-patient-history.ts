import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable, patientsTable } from "@/db/schema";

interface Params {
  patientId: string;
  clinicId: string;
}

export async function getPatientHistory({ patientId, clinicId }: Params) {
  const [patient, appointments] = await Promise.all([
    db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.id, patientId),
        eq(patientsTable.clinicId, clinicId),
      ),
    }),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.patientId, patientId),
        eq(appointmentsTable.clinicId, clinicId),
      ),
      orderBy: (t, { desc }) => [desc(t.date)],
      with: { doctor: { with: { specialties: true } } },
    }),
  ]);
  return { patient, appointments };
}
