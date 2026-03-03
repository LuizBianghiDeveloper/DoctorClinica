"use server";

import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const getPatientAppointments = protectedWithClinicActionClient
  .schema(
    z.object({
      patientId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;
    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.patientId, parsedInput.patientId),
        eq(appointmentsTable.clinicId, clinicId),
      ),
      orderBy: (t, { desc }) => [desc(t.date)],
      with: {
        doctor: true,
      },
    });
    return appointments;
  });
