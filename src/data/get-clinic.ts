import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clinicBusinessHoursTable,
  clinicsTable,
} from "@/db/schema";

export async function getClinic(clinicId: string) {
  const [clinic, businessHours] = await Promise.all([
    db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, clinicId),
    }),
    db.query.clinicBusinessHoursTable.findMany({
      where: eq(clinicBusinessHoursTable.clinicId, clinicId),
    }),
  ]);

  return { clinic, businessHours };
}
