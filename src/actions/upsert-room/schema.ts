import { z } from "zod";

export const upsertRoomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  type: z.enum(["room", "equipment"]),
  displayOrder: z.number().int().min(0).default(0),
});

export type UpsertRoomSchema = z.infer<typeof upsertRoomSchema>;
