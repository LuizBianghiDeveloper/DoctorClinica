"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { roomsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertRoomSchema } from "./schema";

export const upsertRoom = protectedWithClinicActionClient
  .schema(upsertRoomSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;

    if (parsedInput.id) {
      const existing = await db.query.roomsTable.findFirst({
        where: eq(roomsTable.id, parsedInput.id),
      });
      if (!existing || existing.clinicId !== clinicId) {
        throw new Error("Sala não encontrada");
      }
      await db
        .update(roomsTable)
        .set({
          name: parsedInput.name,
          type: parsedInput.type,
          displayOrder: parsedInput.displayOrder,
        })
        .where(eq(roomsTable.id, parsedInput.id));
      await createAuditLog(db, {
        clinicId,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Sala "${parsedInput.name}" atualizada`,
        entityType: "room",
        entityId: parsedInput.id,
      });
    } else {
      const [inserted] = await db
        .insert(roomsTable)
        .values({
          clinicId,
          name: parsedInput.name,
          type: parsedInput.type,
          displayOrder: parsedInput.displayOrder,
        })
        .returning({ id: roomsTable.id });
      if (!inserted?.id) throw new Error("Erro ao salvar sala.");
      await createAuditLog(db, {
        clinicId,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Sala "${parsedInput.name}" criada`,
        entityType: "room",
        entityId: inserted.id,
      });
    }

    revalidatePath("/rooms");
    revalidatePath("/appointments");
  });
