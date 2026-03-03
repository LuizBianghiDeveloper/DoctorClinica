"use server";

import { z } from "zod";

import { getAvailableSlotsForDoctorAndDate } from "@/data/get-available-slots";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const getAvailableTimes = protectedWithClinicActionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD
      roomId: z.string().uuid().optional().nullable(),
    }),
  )
  .action(async ({ parsedInput }) => {
    return getAvailableSlotsForDoctorAndDate(
      parsedInput.doctorId,
      parsedInput.date,
      parsedInput.roomId ?? undefined,
    );
  });
