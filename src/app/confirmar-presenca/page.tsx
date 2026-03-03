import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";

import { ConfirmarPresencaClient } from "./_components/confirmar-presenca-client";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmarPresencaPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    return (
      <ConfirmarPresencaClient
        status="error"
        message="Link inválido. Use o link recebido por WhatsApp."
      />
    );
  }

  const appointment = await db.query.appointmentsTable.findFirst({
    where: eq(appointmentsTable.confirmationToken, token),
    with: {
      patient: true,
      doctor: true,
      clinic: true,
    },
  });

  if (!appointment) {
    return (
      <ConfirmarPresencaClient
        status="error"
        message="Link inválido ou expirado. Entre em contato com a clínica."
      />
    );
  }

  if (appointment.status === "confirmed") {
    const dateFormatted = format(
      new Date(appointment.date),
      "EEEE, dd/MM/yyyy 'às' HH:mm",
      { locale: ptBR },
    );
    return (
      <ConfirmarPresencaClient
        status="already_confirmed"
        message={`Sua presença já estava confirmada para ${dateFormatted}. Até lá! 🙂`}
      />
    );
  }

  if (
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show"
  ) {
    return (
      <ConfirmarPresencaClient
        status="error"
        message="Este agendamento não está mais ativo."
      />
    );
  }

  await db
    .update(appointmentsTable)
    .set({
      status: "confirmed",
      confirmationToken: null,
      updatedAt: new Date(),
    })
    .where(eq(appointmentsTable.id, appointment.id));

  const dateFormatted = format(
    new Date(appointment.date),
    "EEEE, dd/MM/yyyy 'às' HH:mm",
    { locale: ptBR },
  );
  const clinicName = appointment.clinic?.name ?? "nossa clínica";

  return (
    <ConfirmarPresencaClient
      status="success"
      message={`Presença confirmada! Sua consulta é ${dateFormatted} na ${clinicName}. Até lá! 🙂`}
    />
  );
}
