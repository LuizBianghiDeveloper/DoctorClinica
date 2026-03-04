import { z } from "zod";

export const updateUserSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório."),
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(["admin", "user"]),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length >= 8,
      "A senha deve ter pelo menos 8 caracteres.",
    ),
});
