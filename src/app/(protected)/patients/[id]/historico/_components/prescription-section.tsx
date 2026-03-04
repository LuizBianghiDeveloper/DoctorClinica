"use client";

import { FileDown, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertPrescription } from "@/actions/upsert-prescription";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { doctorsTable } from "@/db/schema";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";

type Prescription = {
  id: string;
  additionalInstructions: string | null;
  items: Array<{ medication: string; dosage: string; instructions: string | null }>;
};
type Doctor = typeof doctorsTable.$inferSelect & {
  specialties?: { specialty: string }[];
};

export type PrescriptionAppointment = {
  id: string;
  date: Date;
  patientId: string;
  doctorId: string;
  doctor: Doctor | null;
  patient: { name: string } | null;
};

interface PrescriptionSectionProps {
  appointment: PrescriptionAppointment;
  prescription: Prescription | null;
  patientBirthDate?: string | null;
  clinicName: string;
  clinicAddress?: string | null;
}

export function PrescriptionSection({
  appointment,
  prescription,
  patientBirthDate,
  clinicName,
  clinicAddress,
}: PrescriptionSectionProps) {
  const router = useRouter();
  const action = useAction(upsertPrescription, {
    onSuccess: () => {
      toast.success("Prescrição salva.");
      router.refresh();
    },
    onError: (e) => toast.error(e.error?.serverError ?? "Erro ao salvar prescrição."),
  });

  const handleDownloadPDF = () => {
    if (!prescription || !appointment.patient || !appointment.doctor) return;
    generatePrescriptionPDF({
      patientName: appointment.patient.name,
      patientBirthDate: patientBirthDate ?? null,
      doctorName: appointment.doctor.name,
      doctorSpecialty: appointment.doctor.specialties?.[0]?.specialty,
      clinicName,
      clinicAddress,
      date: String(appointment.date),
      items: prescription.items.map((i) => ({
        medication: i.medication,
        dosage: i.dosage,
        instructions: i.instructions,
      })),
      additionalInstructions: prescription.additionalInstructions,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Prescrição</span>
        <div className="flex gap-1">
          {prescription && prescription.items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <FileDown className="size-4" />
              PDF
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="size-4" />
                {prescription ? "Editar" : "Nova"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {prescription ? "Editar prescrição" : "Nova prescrição"}
                </DialogTitle>
              </DialogHeader>
              <PrescriptionForm
                appointment={appointment}
                prescription={prescription}
                onSubmit={(data) => {
                  action.execute({
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    additionalInstructions: data.additionalInstructions,
                    items: data.items.map((i) => ({
                      medication: i.medication,
                      dosage: i.dosage,
                      instructions: i.instructions,
                    })),
                  });
                }}
                isSubmitting={action.isExecuting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {prescription && prescription.items.length > 0 ? (
        <ul className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
          {prescription.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-2 py-1">
              <span className="font-medium">{item.medication}</span>
              <span className="text-muted-foreground">{item.dosage}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">Nenhuma prescrição registrada.</p>
      )}
    </div>
  );
}

// Form component - we need it inline or in same file for dialog

function PrescriptionForm({
  prescription,
  onSubmit,
  isSubmitting,
}: {
  appointment: PrescriptionAppointment;
  prescription: Prescription | null;
  onSubmit: (data: {
    items: Array<{ medication: string; dosage: string; instructions?: string }>;
    additionalInstructions?: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const form = useForm({
    defaultValues: {
      items: prescription?.items?.length
        ? prescription.items.map((i) => ({
            medication: i.medication,
            dosage: i.dosage,
            instructions: i.instructions ?? "",
          }))
        : [{ medication: "", dosage: "", instructions: "" }],
      additionalInstructions: prescription?.additionalInstructions ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <input
              {...form.register(`items.${index}.medication`)}
              placeholder="Medicamento"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <input
              {...form.register(`items.${index}.dosage`)}
              placeholder="Dosagem"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <input
              {...form.register(`items.${index}.instructions`)}
              placeholder="Posologia (opcional)"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ medication: "", dosage: "", instructions: "" })}
      >
        <Plus className="size-4" />
        Adicionar medicamento
      </Button>
      <textarea
        {...form.register("additionalInstructions")}
        placeholder="Orientações adicionais (opcional)"
        className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
      </Button>
    </form>
  );
}
