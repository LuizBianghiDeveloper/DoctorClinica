"use client";

import dayjs from "dayjs";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateAppointmentNotes } from "@/actions/update-appointment-notes";
import { Button } from "@/components/ui/button";
import { RichTextContent, RichTextEditor } from "@/components/ui/rich-text-editor";
import { doctorsTable } from "@/db/schema";

type AppointmentWithDoctor = {
  id: string;
  date: Date;
  endDate: Date | null;
  notes: string | null;
  doctor:
    | (typeof doctorsTable.$inferSelect & {
        specialties?: { specialty: string }[];
      })
    | null;
};

interface PatientHistoryContentProps {
  patientId: string;
  patientName: string;
  allergiesRestrictions?: string | null;
  initialAppointments: AppointmentWithDoctor[];
}

export function PatientHistoryContent({
  patientId: _patientId,
  patientName,
  allergiesRestrictions,
  initialAppointments,
}: PatientHistoryContentProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const updateNotesAction = useAction(updateAppointmentNotes, {
    onSuccess: () => {
      toast.success("Anotações atualizadas.");
      setEditingNotesId(null);
      router.refresh();
    },
    onError: () => {
      toast.error("Erro ao atualizar anotações.");
    },
  });

  const handleStartEditNotes = (appointment: AppointmentWithDoctor) => {
    setEditingNotesId(appointment.id);
    setNotesDraft(appointment.notes ?? "");
  };

  const handleSaveNotes = (appointmentId: string) => {
    updateNotesAction.execute({ appointmentId, notes: notesDraft || undefined });
  };

  const handleCancelEditNotes = () => {
    setEditingNotesId(null);
    setNotesDraft("");
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
          <Link href="/patients">← Voltar aos pacientes</Link>
        </Button>
      </div>

      {allergiesRestrictions?.trim() && (
        <div className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 flex items-start gap-2 rounded-xl border px-4 py-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-500 mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
              Alergias / restrições
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              {allergiesRestrictions}
            </p>
          </div>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-clinic-primary/20 to-clinic-secondary/20">
            <FileText className="text-muted-foreground size-8" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhuma consulta registrada para {patientName}.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appointment) => {
            const doctor = appointment.doctor;
            const isEditing = editingNotesId === appointment.id;
            return (
              <li key={appointment.id}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-xl shadow-primary/5 transition-shadow hover:shadow-primary/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {dayjs(appointment.date).format("DD/MM/YYYY")}
                      {" · "}
                      {appointment.endDate
                        ? `${dayjs(appointment.date).format("HH:mm")} – ${dayjs(appointment.endDate).format("HH:mm")}`
                        : dayjs(appointment.date).format("HH:mm")}
                    </span>
                    {doctor && (
                      <span className="text-muted-foreground text-sm">
                        {doctor.name}
                        {doctor.specialties?.length
                          ? ` · ${doctor.specialties.map((s) => s.specialty).join(", ")}`
                          : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <RichTextEditor
                          value={notesDraft}
                          onChange={setNotesDraft}
                          placeholder="Anotações do atendimento..."
                          minHeight="140px"
                          compact
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
                            onClick={() => handleSaveNotes(appointment.id)}
                            disabled={updateNotesAction.isExecuting}
                          >
                            {updateNotesAction.isExecuting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/20 hover:bg-primary/5"
                            onClick={handleCancelEditNotes}
                            disabled={updateNotesAction.isExecuting}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <RichTextContent
                          html={appointment.notes ?? ""}
                          className="text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-8 text-muted-foreground"
                          onClick={() => handleStartEditNotes(appointment)}
                        >
                          {appointment.notes ? "Editar anotações" : "Adicionar anotações"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
