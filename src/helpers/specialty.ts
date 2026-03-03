/** Formata especialidades do profissional para exibição (ex.: "Clínica Médica, Ecografia"). */
export function formatDoctorSpecialties(
  specialties: { specialty: string }[] | undefined | null,
): string {
  if (!specialties?.length) return "—";
  return specialties.map((s) => s.specialty).join(", ");
}
