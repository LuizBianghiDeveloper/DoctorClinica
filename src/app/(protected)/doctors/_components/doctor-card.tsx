"use client";

import {
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteDoctor } from "@/actions/delete-doctor";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyInCents } from "@/helpers/currency";
import { formatDoctorSpecialties } from "@/helpers/specialty";

import {
  type DoctorWithAvailability,
  getAvailability,
} from "../_helpers/availability";
import { WEEK_DAY_LABELS } from "./schedule-time-options";

interface DoctorCardProps {
  doctor: DoctorWithAvailability;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const deleteDoctorAction = useAction(deleteDoctor, {
    onSuccess: () => {
      toast.success("Profissional deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar profissional.");
    },
  });
  const handleDeleteDoctorClick = () => {
    if (!doctor) return;
    deleteDoctorAction.execute({ id: doctor.id });
  };

  const doctorInitials = doctor.name
    .split(" ")
    .map((name) => name[0])
    .join("");
  const availability = getAvailability(doctor);
  const byDay = "byDay" in availability ? availability.byDay : undefined;

  const formatTime = (t: string) => t.substring(0, 5);

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 ring-2 ring-background shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-clinic-primary to-clinic-secondary text-base font-semibold text-white">
              {doctorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{doctor.name}</h3>
            <p className="text-muted-foreground truncate text-sm">
              {formatDoctorSpecialties(doctor.specialties)}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator className="bg-border/60" />
      <CardContent className="flex flex-col gap-3 py-4">
        {byDay && byDay.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {byDay
              .sort((a, b) => a.weekDay - b.weekDay)
              .map((slot) => (
                <Badge
                  key={slot.weekDay}
                  variant="secondary"
                  className="border-0 bg-clinic-primary/10 text-xs font-medium text-clinic-primary"
                >
                  <CalendarIcon className="mr-1 size-3" />
                  {WEEK_DAY_LABELS[slot.weekDay]?.slice(0, 3)} {formatTime(slot.fromTime)}-{formatTime(slot.toTime)}
                </Badge>
              ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="border-0 bg-clinic-primary/10 text-xs font-medium text-clinic-primary"
            >
              <CalendarIcon className="mr-1 size-3" />
              {availability.from.format("dddd")} a {availability.to.format("dddd")}
            </Badge>
            <Badge
              variant="secondary"
              className="border-0 bg-clinic-primary/10 text-xs font-medium text-clinic-primary"
            >
              <ClockIcon className="mr-1 size-3" />
              {availability.from.format("HH:mm")} às{" "}
              {availability.to.format("HH:mm")}
            </Badge>
          </div>
        )}
        <Badge
          variant="secondary"
          className="w-fit border-0 bg-emerald-500/10 text-xs font-medium text-emerald-700"
        >
          <DollarSignIcon className="mr-1 size-3" />
          {formatCurrencyInCents(doctor.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator className="bg-border/60" />
      <CardFooter className="flex flex-col gap-2 py-4">
        <Button
          className="w-full bg-gradient-to-r from-clinic-primary to-clinic-secondary font-medium transition-all hover:brightness-95 hover:shadow-lg"
          asChild
        >
          <Link href={`/doctors/${doctor.id}/editar`}>
            Ver detalhes / Editar horários
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-muted-foreground transition-colors hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
            >
              <TrashIcon className="size-4" />
              Deletar profissional
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar esse profissional?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser revertida. Isso irá deletar o profissional e
                todas as consultas agendadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctorClick}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
