"use server";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  clinicBusinessHoursTable,
  clinicsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertClinicSchema } from "./schema";

dayjs.extend(customParseFormat);

const TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

function toTimeString(value: string | null | undefined): string {
  if (value == null || value === "") return "08:00:00";
  const match = value.match(TIME_REGEX);
  if (match) {
    const [, h, m, s] = match;
    return `${Number(h)!.toString().padStart(2, "0")}:${m}:${(s ?? "00").padStart(2, "0")}`;
  }
  const parsed = dayjs(value, ["HH:mm:ss", "H:mm:ss", "HH:mm", "H:mm"], true);
  if (parsed.isValid()) return parsed.format("HH:mm:ss");
  return "08:00:00";
}

export const upsertClinic = protectedWithClinicActionClient
  .schema(upsertClinicSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;
    const {
      businessHours,
      website,
      logoUrl,
      primaryColor,
      secondaryColor,
      ...clinicData
    } = parsedInput;

    await db
      .update(clinicsTable)
      .set({
        ...clinicData,
        website: website || null,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
      })
      .where(eq(clinicsTable.id, clinicId));

    await db
      .delete(clinicBusinessHoursTable)
      .where(eq(clinicBusinessHoursTable.clinicId, clinicId));

    const hoursToInsert = businessHours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        clinicId,
        weekDay: h.weekDay,
        openTime: toTimeString(h.openTime),
        closeTime: toTimeString(h.closeTime),
        isClosed: false,
      }));

    if (hoursToInsert.length > 0) {
      await db.insert(clinicBusinessHoursTable).values(hoursToInsert);
    }

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Clínica "${clinicData.name}" atualizada`,
      entityType: "clinic",
      entityId: clinicId,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
  });
