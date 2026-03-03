import { z } from "zod";

export const updateAppointmentNotesSchema = z.object({
  appointmentId: z.string().uuid(),
  notes: z.string().optional(),
});
