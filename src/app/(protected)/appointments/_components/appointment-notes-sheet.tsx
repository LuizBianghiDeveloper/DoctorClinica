"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateAppointmentNotes } from "@/actions/update-appointment-notes";
import { Button } from "@/components/ui/button";
import { RichTextContent, RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AppointmentForNotes = {
  id: string;
  date: Date;
  notes: string | null;
  patient: { name: string };
  doctor?: { name: string };
};

interface AppointmentNotesSheetProps {
  appointment: AppointmentForNotes | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentNotesSheet({
  appointment,
  open,
  onOpenChange,
}: AppointmentNotesSheetProps) {
  const router = useRouter();
  const [notesDraft, setNotesDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (appointment) {
      setNotesDraft(appointment.notes ?? "");
      setIsEditing(false);
    }
  }, [appointment, open]);

  const updateAction = useAction(updateAppointmentNotes, {
    onSuccess: () => {
      toast.success("Anotações atualizadas.");
      setIsEditing(false);
      router.refresh();
    },
    onError: () => toast.error("Erro ao atualizar anotações."),
  });

  const handleSave = () => {
    if (!appointment) return;
    updateAction.execute({
      appointmentId: appointment.id,
      notes: notesDraft || undefined,
    });
  };

  if (!appointment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Anotações
          </SheetTitle>
          <SheetDescription>
            <span className="font-medium text-foreground">{appointment.patient.name}</span>
            {" · "}
            {format(new Date(appointment.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            {appointment.doctor && ` · ${appointment.doctor.name}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          {isEditing ? (
            <>
              <RichTextEditor
                value={notesDraft}
                onChange={setNotesDraft}
                placeholder="Anotações do atendimento..."
                minHeight="200px"
                compact
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
                  onClick={handleSave}
                  disabled={updateAction.isExecuting}
                >
                  {updateAction.isExecuting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotesDraft(appointment.notes ?? "");
                    setIsEditing(false);
                  }}
                  disabled={updateAction.isExecuting}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <RichTextContent html={appointment.notes ?? ""} className="min-h-[100px] text-sm" />
              <Button
                variant="ghost"
                size="sm"
                className="w-fit text-muted-foreground"
                onClick={() => setIsEditing(true)}
              >
                {appointment.notes ? "Editar anotações" : "Adicionar anotações"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
