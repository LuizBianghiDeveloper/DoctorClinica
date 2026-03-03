"use client";

import {
  CheckCircleIcon,
  MoreVerticalIcon,
  MessageCircleIcon,
  XCircleIcon,
  TrashIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import { sendWhatsAppAppointment } from "@/actions/send-whatsapp-appointment";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appointmentsTable } from "@/db/schema";

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
};

interface AppointmentsTableActionsProps {
  appointment: AppointmentWithRelations;
}

const AppointmentsTableActions = ({
  appointment,
}: AppointmentsTableActionsProps) => {
  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar agendamento.");
    },
  });

  const sendWhatsAppAction = useAction(sendWhatsAppAppointment, {
    onSuccess: () => {
      toast.success("Lembrete enviado por WhatsApp.");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao enviar WhatsApp.");
    },
  });

  const updateStatusAction = useAction(updateAppointmentStatus, {
    onSuccess: () => {
      toast.success("Status atualizado.");
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
    },
  });

  const handleDeleteAppointmentClick = () => {
    if (!appointment) return;
    deleteAppointmentAction.execute({ id: appointment.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{appointment.patient.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            updateStatusAction.execute({
              appointmentId: appointment.id,
              status: "confirmed",
            })
          }
          disabled={updateStatusAction.isPending}
        >
          <CheckCircleIcon className="mr-2 size-4" />
          Marcar como confirmado
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            updateStatusAction.execute({
              appointmentId: appointment.id,
              status: "cancelled",
            })
          }
          disabled={updateStatusAction.isPending}
        >
          <XCircleIcon className="mr-2 size-4" />
          Marcar como desmarcado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            sendWhatsAppAction.execute({
              appointmentId: appointment.id,
              type: "reminder",
            })
          }
          disabled={!appointment.patient.phoneNumber?.trim() || sendWhatsAppAction.isPending}
        >
          <MessageCircleIcon className="mr-2 size-4" />
          {sendWhatsAppAction.isPending ? "Enviando..." : "Enviar lembrete WhatsApp"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <TrashIcon />
              Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar esse agendamento?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser revertida. Isso irá deletar o agendamento
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-primary/20 hover:bg-primary/5">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAppointmentClick} className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppointmentsTableActions;
