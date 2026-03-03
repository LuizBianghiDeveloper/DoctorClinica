"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Stethoscope, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertDoctor } from "@/actions/upsert-doctor";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorsTable } from "@/db/schema";

import { medicalSpecialties } from "../_constants";
import { getScheduleFromDoctor } from "../_helpers/availability";
import {
  defaultFromTime,
  defaultToTime,
  formatTimeOption,
  TIME_OPTIONS,
  WEEK_DAY_LABELS,
} from "./schedule-time-options";

const SPECIALTY_OUTRA = "Outra";

const dayScheduleSchema = z
  .object({
    weekDay: z.number().min(0).max(6),
    fromTime: z.string().min(1, { message: "Hora de início é obrigatória." }),
    toTime: z.string().min(1, { message: "Hora de término é obrigatória." }),
  })
  .refine((data) => data.fromTime < data.toTime, {
    message: "O horário de início deve ser anterior ao de término.",
    path: ["toTime"],
  });

const specialtyItemSchema = z.object({
  specialty: z.string().trim(),
  customSpecialty: z.string().trim().optional(),
});

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialties: z.array(specialtyItemSchema).min(1, {
      message: "Adicione ao menos uma especialidade.",
    }),
    appointmentPrice: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    commissionPercent: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    schedule: z
      .array(dayScheduleSchema)
      .min(1, { message: "Adicione ao menos um dia de trabalho." }),
  })
  .refine(
    (data) => {
      const hasValid = data.specialties.some((s) => {
        if (s.specialty === SPECIALTY_OUTRA)
          return !!s.customSpecialty?.trim();
        return !!s.specialty?.trim();
      });
      return hasValid;
    },
    {
      message: "Adicione ao menos uma especialidade.",
      path: ["specialties"],
    },
  )
  .refine(
    (data) => {
      const invalid = data.specialties.some(
        (s) => s.specialty === SPECIALTY_OUTRA && !s.customSpecialty?.trim(),
      );
      return !invalid;
    },
    {
      message: "Quando escolher 'Outra', informe o nome da especialidade.",
      path: ["specialties"],
    },
  )
  .refine(
    (data) => {
      const days = new Set(data.schedule.map((s) => s.weekDay));
      return days.size === data.schedule.length;
    },
    { message: "Não pode haver mais de um horário por dia.", path: ["schedule"] },
  );

const defaultSchedule = [
  { weekDay: 1, fromTime: defaultFromTime, toTime: defaultToTime },
  { weekDay: 2, fromTime: defaultFromTime, toTime: defaultToTime },
  { weekDay: 3, fromTime: defaultFromTime, toTime: defaultToTime },
  { weekDay: 4, fromTime: defaultFromTime, toTime: defaultToTime },
  { weekDay: 5, fromTime: defaultFromTime, toTime: defaultToTime },
];

type DoctorWithAvailability = typeof doctorsTable.$inferSelect & {
  availability?: { weekDay: number; fromTime: string; toTime: string }[];
  specialties?: { specialty: string }[];
};

interface UpsertDoctorFormProps {
  isOpen?: boolean;
  doctor?: DoctorWithAvailability;
  onSuccess?: () => void;
  /** Quando "page", o formulário é exibido em tela cheia (sem modal). */
  variant?: "dialog" | "page";
}

const UpsertDoctorForm = ({
  doctor,
  onSuccess,
  isOpen = true,
  variant = "dialog",
}: UpsertDoctorFormProps) => {
  const router = useRouter();
  const getDefaultSpecialties = (): z.infer<typeof specialtyItemSchema>[] => {
    if (!doctor?.specialties?.length) {
      return [{ specialty: "", customSpecialty: "" }];
    }
    return doctor.specialties.map((s) => ({
      specialty: medicalSpecialties.some((m) => m.value === s.specialty)
        ? s.specialty
        : SPECIALTY_OUTRA,
      customSpecialty: medicalSpecialties.some((m) => m.value === s.specialty)
        ? ""
        : s.specialty,
    }));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialties: getDefaultSpecialties(),
      appointmentPrice: doctor?.appointmentPriceInCents
        ? doctor.appointmentPriceInCents / 100
        : 0,
      commissionPercent: doctor?.commissionPercent ?? undefined,
      schedule: doctor ? getScheduleFromDoctor(doctor) : defaultSchedule,
    },
  });

  useEffect(() => {
    if (variant === "page" || isOpen) {
      form.reset({
        name: doctor?.name ?? "",
        specialties: getDefaultSpecialties(),
        appointmentPrice: doctor?.appointmentPriceInCents
          ? doctor.appointmentPriceInCents / 100
          : 0,
        commissionPercent: doctor?.commissionPercent ?? undefined,
        schedule: doctor ? getScheduleFromDoctor(doctor) : defaultSchedule,
      });
    }
  }, [isOpen, variant, form, doctor]);

  const { fields: specialtyFields, append: appendSpecialty, remove: removeSpecialty } =
    useFieldArray({
      control: form.control,
      name: "specialties",
    });

  const { remove } = useFieldArray({
    control: form.control,
    name: "schedule",
  });
  const schedule = form.watch("schedule") ?? [];

  const addDay = (weekDay: number) => {
    const sorted = [...schedule, { weekDay, fromTime: defaultFromTime, toTime: defaultToTime }].sort(
      (a, b) => a.weekDay - b.weekDay,
    );
    form.setValue("schedule", sorted);
  };
  const removeDay = (index: number) => {
    remove(index);
  };
  const getIndexForWeekDay = (weekDay: number) => schedule.findIndex((s) => s.weekDay === weekDay);

  const upsertDoctorAction = useAction(upsertDoctor, {
    onSuccess: () => {
      toast.success(doctor ? "Profissional atualizado com sucesso." : "Profissional adicionado com sucesso.");
      onSuccess?.();
      if (variant === "page") router.push("/doctors");
    },
    onError: () => {
      toast.error("Erro ao adicionar profissional.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const specialties = values.specialties
      .map((s) =>
        s.specialty === SPECIALTY_OUTRA && s.customSpecialty?.trim()
          ? s.customSpecialty.trim()
          : s.specialty,
      )
      .filter(Boolean);
    upsertDoctorAction.execute({
      name: values.name,
      specialties,
      appointmentPriceInCents: values.appointmentPrice * 100,
      commissionPercent:
        values.commissionPercent != null && values.commissionPercent > 0
          ? values.commissionPercent
          : undefined,
      schedule: values.schedule,
      id: doctor?.id,
    });
  };

  const title = doctor ? doctor.name : "Adicionar profissional";
  const description = doctor
    ? "Edite as informações e horários desse profissional."
    : "Adicione um novo profissional e defina os horários de atendimento.";

  const formContent = (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Informações básicas</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Dados do profissional
              </p>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-11" placeholder="Nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Especialidades</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Adicione uma ou mais especialidades (ex.: Clínico + Ecografia).
              </p>
            </div>
            {specialtyFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`specialties.${index}.specialty`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicalSpecialties.map((sp) => (
                              <SelectItem key={sp.value} value={sp.value}>
                                {sp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch(`specialties.${index}.specialty`) === SPECIALTY_OUTRA && (
                  <FormField
                    control={form.control}
                    name={`specialties.${index}.customSpecialty`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="Ex.: Ecografia, Quiropraxia..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeSpecialty(index)}
                  disabled={specialtyFields.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
              onClick={() =>
                appendSpecialty({ specialty: "", customSpecialty: "" })
              }
            >
              <Plus className="size-4" />
              Adicionar especialidade
            </Button>
            <FormMessage>
              {form.formState.errors.specialties?.message}
            </FormMessage>
          </section>
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Valores</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Preço da consulta e comissão
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="appointmentPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço da consulta</FormLabel>
                  <NumericFormat
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value.floatValue);
                    }}
                    decimalScale={2}
                    fixedDecimalScale
                    decimalSeparator=","
                    allowNegative={false}
                    allowLeadingZeros={false}
                    thousandSeparator="."
                    customInput={Input}
                    prefix="R$"
                    className="h-11"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commissionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <NumericFormat
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(
                        value.floatValue != null ? value.floatValue : null,
                      );
                    }}
                    decimalScale={1}
                    allowNegative={false}
                    allowLeadingZeros={false}
                    thousandSeparator=""
                    suffix="%"
                    customInput={Input}
                    className="h-11"
                    placeholder="0"
                  />
                  <p className="text-muted-foreground text-xs">
                    Por consulta, para relatório e fechamento
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </section>
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Horários por dia de trabalho</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Marque os dias em que o profissional atende e defina o horário de cada um.
              </p>
            </div>
            {([0, 1, 2, 3, 4, 5, 6] as const).map((weekDay) => {
              const index = getIndexForWeekDay(weekDay);
              const isWorking = index >= 0;
              return (
                <div
                  key={weekDay}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 transition-colors ${
                    isWorking
                      ? "border-border/60 bg-clinic-primary/5"
                      : "border-border/40 bg-muted/20"
                  }`}
                >
                  <div className="flex w-36 shrink-0 items-center gap-2">
                    <span className="text-sm font-medium">
                      {WEEK_DAY_LABELS[weekDay]}
                    </span>
                    {!isWorking ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => addDay(weekDay)}
                      >
                        Trabalha neste dia
                      </Button>
                    ) : null}
                  </div>
                  {isWorking && index >= 0 && (
                    <>
                      <FormField
                        control={form.control}
                        name={`schedule.${index}.fromTime`}
                        render={({ field }) => (
                          <FormItem className="flex-1 min-w-[100px]">
                            <FormLabel className="text-xs">Das</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TIME_OPTIONS.map((group) => (
                                  <SelectGroup key={group.group}>
                                    <SelectLabel>{group.group}</SelectLabel>
                                    {group.slots.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {formatTimeOption(t)}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedule.${index}.toTime`}
                        render={({ field }) => (
                          <FormItem className="flex-1 min-w-[100px]">
                            <FormLabel className="text-xs">Às</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TIME_OPTIONS.map((group) => (
                                  <SelectGroup key={group.group}>
                                    <SelectLabel>{group.group}</SelectLabel>
                                    {group.slots.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {formatTimeOption(t)}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeDay(index)}
                      >
                        <Trash2 className="size-4" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            <FormMessage>
              {form.formState.errors.schedule?.message}
            </FormMessage>
          </section>
          {variant === "dialog" ? (
            <DialogFooter>
              <Button
                type="submit"
                disabled={upsertDoctorAction.isPending}
                className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
              >
                {upsertDoctorAction.isPending
                  ? "Salvando..."
                  : doctor
                    ? "Salvar"
                    : "Adicionar"}
              </Button>
            </DialogFooter>
          ) : (
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={upsertDoctorAction.isPending}
                className="bg-gradient-to-r from-clinic-primary to-clinic-secondary font-medium shadow-md shadow-clinic-primary/25 hover:brightness-95 hover:shadow-lg"
              >
                {upsertDoctorAction.isPending
                  ? "Salvando..."
                  : doctor
                    ? "Salvar"
                    : "Adicionar"}
              </Button>
            </div>
          )}
        </form>
      </Form>
  );

  if (variant === "page") {
    return (
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-primary to-clinic-secondary text-white shadow-md">
            <Stethoscope className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {formContent}
    </DialogContent>
  );
};

export default UpsertDoctorForm;
