"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { roomsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteRoom = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const room = await db.query.roomsTable.findFirst({
      where: eq(roomsTable.id, parsedInput.id),
    });
    if (!room) {
      throw new Error("Sala não encontrada");
    }
    if (room.clinicId !== ctx.user.clinic.id) {
      throw new Error("Sala não encontrada");
    }
    await db.delete(roomsTable).where(eq(roomsTable.id, parsedInput.id));
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Sala "${room.name}" removida`,
      entityType: "room",
      entityId: parsedInput.id,
    });
    revalidatePath("/rooms");
    revalidatePath("/appointments");
  });
