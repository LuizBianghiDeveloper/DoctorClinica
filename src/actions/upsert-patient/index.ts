"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = protectedWithClinicActionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, birthDate, rg, cpf, photoUrl, allergiesRestrictions, ...rest } =
      parsedInput;
    const payload = {
      ...rest,
      birthDate: birthDate?.trim() || null,
      rg: rg?.trim() || null,
      cpf: cpf?.replace(/\D/g, "") || null,
      photoUrl: photoUrl || null,
      allergiesRestrictions: allergiesRestrictions?.trim() || null,
    };
    await db
      .insert(patientsTable)
      .values({
        ...payload,
        id: id,
        clinicId: ctx.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [patientsTable.id],
        set: payload,
      });
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: id
        ? `Paciente "${payload.name}" atualizado`
        : `Paciente "${payload.name}" criado`,
      entityType: "patient",
      entityId: id ?? undefined,
    });
    revalidatePath("/patients");
  });
