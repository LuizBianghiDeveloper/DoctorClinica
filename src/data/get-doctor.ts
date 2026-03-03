import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";

interface Params {
  doctorId: string;
  clinicId: string;
}

export async function getDoctor({ doctorId, clinicId }: Params) {
  return db.query.doctorsTable.findFirst({
    where: and(
      eq(doctorsTable.id, doctorId),
      eq(doctorsTable.clinicId, clinicId),
    ),
    with: { availability: true, timeBlocks: true, specialties: true },
  });
}
