import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appointmentTypesTable } from "@/db/schema";

export async function getAppointmentTypes(clinicId: string) {
  return db.query.appointmentTypesTable.findMany({
    where: eq(appointmentTypesTable.clinicId, clinicId),
    orderBy: (t, { asc }) => [asc(t.displayOrder), asc(t.name)],
  });
}
