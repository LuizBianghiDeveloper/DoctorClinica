import { z } from "zod";

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  birthDate: z.string().optional(),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  photoUrl: z.string().optional(),
  allergiesRestrictions: z.string().optional(),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
