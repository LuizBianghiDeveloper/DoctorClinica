"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { appointmentsTable } from "@/db/schema";
import { formatDoctorSpecialties } from "@/helpers/specialty";

import AppointmentsTableActions from "./table-actions";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Realizado",
  no_show: "Falta",
  cancelled: "Desmarcado",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "secondary",
  confirmed: "default",
  completed: "outline",
  no_show: "destructive",
  cancelled: "destructive",
};

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sex: "male" | "female";
  };
  doctor: {
    id: string;
    name: string;
    specialties?: { specialty: string }[];
  };
  appointmentType?: { id: string; name: string } | null;
  room?: { id: string; name: string } | null;
};

export const appointmentsTableColumns: ColumnDef<AppointmentWithRelations>[] = [
  {
    id: "patient",
    accessorKey: "patient.name",
    header: "Paciente",
  },
  {
    id: "doctor",
    accessorKey: "doctor.name",
    header: "Profissional",
    cell: (params) => {
      const appointment = params.row.original;
      return `${appointment.doctor.name}`;
    },
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Data",
    cell: (params) => {
      const appointment = params.row.original;
      return format(new Date(appointment.date), "dd/MM/yyyy", {
        locale: ptBR,
      });
    },
  },
  {
    id: "time",
    header: "Horário",
    cell: (params) => {
      const appointment = params.row.original;
      const start = format(new Date(appointment.date), "HH:mm", {
        locale: ptBR,
      });
      const end = appointment.endDate
        ? format(new Date(appointment.endDate), "HH:mm", { locale: ptBR })
        : null;
      return end ? `${start} - ${end}` : start;
    },
  },
  {
    id: "specialty",
    header: "Especialidade",
    cell: (params) => {
      const appointment = params.row.original;
      return formatDoctorSpecialties(appointment.doctor.specialties);
    },
  },
  {
    id: "type",
    header: "Tipo",
    cell: (params) => {
      const appointment = params.row.original;
      return appointment.appointmentType?.name ?? "—";
    },
  },
  {
    id: "room",
    header: "Sala",
    cell: (params) => {
      const appointment = params.row.original;
      return appointment.room?.name ?? "—";
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (params) => {
      const appointment = params.row.original;
      const status = appointment.status ?? "scheduled";
      return (
        <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
          {STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: "price",
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: (params) => {
      const appointment = params.row.original;
      const price = appointment.appointmentPriceInCents / 100;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
    },
  },
  {
    id: "actions",
    cell: (params) => {
      const appointment = params.row.original;
      return <AppointmentsTableActions appointment={appointment} />;
    },
  },
];

/** Colunas reduzidas para o quadro "Agendamentos de hoje" no dashboard (sem data, tipo, sala e valor) */
export const dashboardAppointmentsTableColumns: ColumnDef<AppointmentWithRelations>[] =
  appointmentsTableColumns.filter(
    (col) =>
      col.id !== "date" &&
      col.id !== "type" &&
      col.id !== "room" &&
      col.id !== "price"
  );
