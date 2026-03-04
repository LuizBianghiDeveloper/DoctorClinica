"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertClinicalEvolution } from "@/actions/upsert-clinical-evolution";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClinicalEvolutionFormProps {
  appointmentId: string;
  initialData?: {
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  } | null;
  onCancel: () => void;
}

export function ClinicalEvolutionForm({
  appointmentId,
  initialData,
  onCancel,
}: ClinicalEvolutionFormProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjective: initialData?.subjective ?? "",
      objective: initialData?.objective ?? "",
      assessment: initialData?.assessment ?? "",
      plan: initialData?.plan ?? "",
    },
  });

  const action = useAction(upsertClinicalEvolution, {
    onSuccess: () => {
      toast.success("Evolução clínica salva.");
      router.refresh();
      onCancel();
    },
    onError: () => toast.error("Erro ao salvar evolução clínica."),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          action.execute({
            appointmentId,
            ...values,
          }),
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="subjective"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                S - Subjetivo (queixa, anamnese)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Relato do paciente..."
                  className="min-h-[60px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                O - Objetivo (exame físico, sinais)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Achados do exame..."
                  className="min-h-[60px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assessment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                A - Avaliação (hipótese diagnóstica)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Impressão diagnóstica..."
                  className="min-h-[60px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                P - Plano (conduta, tratamento)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Conduta proposta..."
                  className="min-h-[60px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
            disabled={action.isExecuting}
          >
            {action.isExecuting ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
