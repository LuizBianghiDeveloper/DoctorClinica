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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doctorsTable } from "@/db/schema";

import { ClinicalEvolutionForm } from "./clinical-evolution-form";
import { DiagnosesSection } from "./diagnoses-section";
import { ExamsSection } from "./exams-section";
import { PrescriptionSection } from "./prescription-section";

type AppointmentFull = {
  id: string;
  date: Date;
  endDate: Date | null;
  notes: string | null;
  patientId: string;
  doctorId: string;
  doctor:
    | (typeof doctorsTable.$inferSelect & {
        specialties?: { specialty: string }[];
      })
    | null;
  patient: { id: string; name: string; birthDate: string | null } | null;
  clinicalEvolution: {
    id: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  } | null;
  prescriptions: Array<{
    id: string;
    additionalInstructions: string | null;
    items: Array<{ medication: string; dosage: string; instructions: string | null }>;
  }>;
  exams: Array<{
    id: string;
    name: string;
    status: "requested" | "pending" | "done" | "cancelled";
  }>;
  diagnoses: Array<{ id: string; icdCode: string; description: string }>;
};

interface PatientHistoryContentProps {
  patientId: string;
  patientName: string;
  patientBirthDate?: string | null;
  allergiesRestrictions?: string | null;
  initialAppointments: AppointmentFull[];
  clinicName: string;
  clinicAddress?: string | null;
}

export function PatientHistoryContent({
  patientId: _patientId,
  patientName,
  patientBirthDate,
  allergiesRestrictions,
  initialAppointments,
  clinicName,
  clinicAddress,
}: PatientHistoryContentProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [editingEvolutionId, setEditingEvolutionId] = useState<string | null>(null);

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

  const handleStartEditNotes = (appointment: AppointmentFull) => {
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
            const isEditingEvolution = editingEvolutionId === appointment.id;
            const prescription = appointment.prescriptions?.[0] ?? null;
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

                  <Tabs defaultValue="notes" className="mt-4">
                    <TabsList className="mb-3 grid w-full grid-cols-5">
                      <TabsTrigger value="notes">Anotações</TabsTrigger>
                      <TabsTrigger value="evolution">Evolução</TabsTrigger>
                      <TabsTrigger value="prescription">Prescrição</TabsTrigger>
                      <TabsTrigger value="exams">Exames</TabsTrigger>
                      <TabsTrigger value="diagnoses">CID</TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="mt-0">
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
                    </TabsContent>

                    <TabsContent value="evolution" className="mt-0">
                      {isEditingEvolution ? (
                        <ClinicalEvolutionForm
                          appointmentId={appointment.id}
                          initialData={appointment.clinicalEvolution}
                          onCancel={() => setEditingEvolutionId(null)}
                        />
                      ) : (
                        <>
                          {appointment.clinicalEvolution &&
                          (appointment.clinicalEvolution.subjective ||
                            appointment.clinicalEvolution.objective ||
                            appointment.clinicalEvolution.assessment ||
                            appointment.clinicalEvolution.plan) ? (
                            <div className="space-y-3 text-sm">
                              {appointment.clinicalEvolution.subjective && (
                                <div>
                                  <span className="text-muted-foreground font-medium">S: </span>
                                  <span>{appointment.clinicalEvolution.subjective}</span>
                                </div>
                              )}
                              {appointment.clinicalEvolution.objective && (
                                <div>
                                  <span className="text-muted-foreground font-medium">O: </span>
                                  <span>{appointment.clinicalEvolution.objective}</span>
                                </div>
                              )}
                              {appointment.clinicalEvolution.assessment && (
                                <div>
                                  <span className="text-muted-foreground font-medium">A: </span>
                                  <span>{appointment.clinicalEvolution.assessment}</span>
                                </div>
                              )}
                              {appointment.clinicalEvolution.plan && (
                                <div>
                                  <span className="text-muted-foreground font-medium">P: </span>
                                  <span>{appointment.clinicalEvolution.plan}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Nenhuma evolução clínica registrada.
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8 text-muted-foreground"
                            onClick={() => setEditingEvolutionId(appointment.id)}
                          >
                            {appointment.clinicalEvolution ? "Editar evolução" : "Adicionar evolução SOAP"}
                          </Button>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="prescription" className="mt-0">
                      <PrescriptionSection
                        appointment={appointment}
                        prescription={prescription}
                        patientBirthDate={patientBirthDate}
                        clinicName={clinicName}
                        clinicAddress={clinicAddress}
                      />
                    </TabsContent>

                    <TabsContent value="exams" className="mt-0">
                      <ExamsSection
                        appointmentId={appointment.id}
                        patientId={appointment.patientId}
                        exams={appointment.exams ?? []}
                      />
                    </TabsContent>

                    <TabsContent value="diagnoses" className="mt-0">
                      <DiagnosesSection
                        appointmentId={appointment.id}
                        diagnoses={appointment.diagnoses ?? []}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
