"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { AlertTriangle, CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { addAppointment } from "@/actions/add-appointment";
import { getAvailableTimes } from "@/actions/get-available-times";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appointmentTypesTable,
  doctorsTable,
  patientsTable,
  roomsTable,
} from "@/db/schema";
import { formatDoctorSpecialties } from "@/helpers/specialty";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.string().min(1, {
    message: "Paciente é obrigatório.",
  }),
  doctorId: z.string().min(1, {
    message: "Profissional é obrigatório.",
  }),
  appointmentTypeId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  appointmentPrice: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    message: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
  durationInMinutes: z.number().min(15).max(240),
  /** Série: repetir semanalmente. 1 = só esta consulta. */
  recurrenceCount: z.number().min(1).max(260).default(1),
  /** Dias da semana para repetir (0=dom, 1=seg, ..., 6=sáb). Quando count > 1, usado para gerar as datas. */
  recurrenceWeekDays: z.array(z.number().min(0).max(6)).default([]),
  /** 1 = toda semana, 2 = semana sim, semana não. */
  recurrenceIntervalWeeks: z.union([z.literal(1), z.literal(2)]).default(1),
  sendWhatsAppConfirmation: z.boolean().default(false),
});

type DoctorWithAvailability = (typeof doctorsTable.$inferSelect) & {
  availability?: { weekDay: number; fromTime: string; toTime: string }[];
  specialties?: { specialty: string }[];
};

type AppointmentType = typeof appointmentTypesTable.$inferSelect;
type Room = typeof roomsTable.$inferSelect;

interface AddAppointmentFormProps {
  isOpen: boolean;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: DoctorWithAvailability[];
  appointmentTypes: AppointmentType[];
  rooms: Room[];
  onSuccess?: () => void;
}

const AddAppointmentForm = ({
  patients,
  doctors,
  appointmentTypes,
  rooms,
  onSuccess,
  isOpen,
}: AddAppointmentFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentTypeId: null as string | null | undefined,
      roomId: null as string | null | undefined,
      appointmentPrice: 0,
      date: undefined,
      time: "",
      durationInMinutes: 30,
      recurrenceCount: 1,
      recurrenceWeekDays: [],
      recurrenceIntervalWeeks: 1,
      sendWhatsAppConfirmation: false,
    },
  });

  const selectedDoctorId = form.watch("doctorId");
  const selectedPatientId = form.watch("patientId");
  const selectedDate = form.watch("date");
  const recurrenceCount = form.watch("recurrenceCount") ?? 1;

  const selectedRoomId = form.watch("roomId");

  const { data: availableTimes } = useQuery({
    queryKey: ["available-times", selectedDate, selectedDoctorId, selectedRoomId],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
        doctorId: selectedDoctorId,
        roomId: selectedRoomId ?? undefined,
      }),
    enabled: !!selectedDate && !!selectedDoctorId,
  });

  const selectedTypeId = form.watch("appointmentTypeId");

  // Atualizar preço e duração quando tipo for selecionado; senão usar preço do profissional
  useEffect(() => {
    if (selectedTypeId) {
      const type = appointmentTypes.find((t) => t.id === selectedTypeId);
      if (type) {
        form.setValue("appointmentPrice", type.priceInCents / 100);
        form.setValue("durationInMinutes", type.durationInMinutes);
      }
    } else if (selectedDoctorId) {
      const selectedDoctor = doctors.find(
        (doctor) => doctor.id === selectedDoctorId,
      );
      if (selectedDoctor) {
        form.setValue(
          "appointmentPrice",
          selectedDoctor.appointmentPriceInCents / 100,
        );
      }
    }
  }, [selectedTypeId, selectedDoctorId, appointmentTypes, doctors, form]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        patientId: "",
        doctorId: "",
        appointmentTypeId: null,
        roomId: null,
        appointmentPrice: 0,
        date: undefined,
        time: "",
        durationInMinutes: 30,
        recurrenceCount: 1,
        recurrenceWeekDays: [],
        recurrenceIntervalWeeks: 1,
        sendWhatsAppConfirmation: false,
      });
    }
  }, [isOpen, form]);

  // Ao mudar a data com série ativa, sugerir o dia da semana da data nos dias de recorrência
  useEffect(() => {
    if (recurrenceCount > 1 && selectedDate) {
      const day = selectedDate.getDay();
      const current = form.getValues("recurrenceWeekDays");
      if (current.length === 0) {
        form.setValue("recurrenceWeekDays", [day]);
      }
    }
  }, [selectedDate, recurrenceCount, form]);

  const recurrenceCountRef = useRef(1);

  const createAppointmentAction = useAction(addAppointment, {
    onSuccess: (data) => {
      onSuccess?.();
      const n = recurrenceCountRef.current;
      toast.success(
        n > 1
          ? `Série de ${n} agendamentos criada com sucesso.`
          : "Agendamento criado com sucesso.",
      );
      if (data?.whatsAppError) {
        toast.warning(
          `Confirmação WhatsApp não enviada: ${data.whatsAppError}`,
          { duration: 8000 },
        );
      } else if (data?.whatsAppSent) {
        toast.success("Confirmação enviada por WhatsApp.");
      }
    },
    onError: () => {
      toast.error("Erro ao criar agendamento.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    recurrenceCountRef.current = values.recurrenceCount ?? 1;
    createAppointmentAction.execute({
      ...values,
      appointmentTypeId: values.appointmentTypeId ?? undefined,
      roomId: values.roomId ?? undefined,
      appointmentPriceInCents: values.appointmentPrice * 100,
      durationInMinutes: values.durationInMinutes,
      recurrenceCount: values.recurrenceCount,
      recurrenceWeekDays:
        values.recurrenceCount > 1 ? values.recurrenceWeekDays : undefined,
      recurrenceIntervalWeeks: values.recurrenceIntervalWeeks,
      sendWhatsAppConfirmation: values.sendWhatsAppConfirmation ?? false,
    });
  };

  const isDateAvailable = (date: Date) => {
    if (!selectedDoctorId) return false;
    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === selectedDoctorId,
    );
    if (!selectedDoctor) return false;
    const dayOfWeek = date.getDay();
    if (
      selectedDoctor.availability &&
      selectedDoctor.availability.length > 0
    ) {
      return selectedDoctor.availability.some((a) => a.weekDay === dayOfWeek);
    }
    return (
      dayOfWeek >= selectedDoctor.availableFromWeekDay &&
      dayOfWeek <= selectedDoctor.availableToWeekDay
    );
  };

  const isDateTimeEnabled = selectedPatientId && selectedDoctorId;

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Novo agendamento</DialogTitle>
        <DialogDescription>
          Crie um novo agendamento para sua clínica.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPatientId && (() => {
                  const patient = patients.find((p) => p.id === selectedPatientId);
                  const allergies = patient?.allergiesRestrictions?.trim();
                  return allergies ? (
                    <div className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 flex items-start gap-2 rounded-md border px-3 py-2">
                      <AlertTriangle className="text-amber-600 dark:text-amber-500 mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
                          Alergias / restrições do paciente
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs">
                          {allergies}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {formatDoctorSpecialties(doctor.specialties)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {rooms.length > 0 && (
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala / recurso</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : v)
                    }
                    value={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue placeholder="Nenhuma (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}{" "}
                          {room.type === "equipment"
                            ? "(Equipamento)"
                            : "(Consultório)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Evita conflito de uso no mesmo horário.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {appointmentTypes.length > 0 && (
            <FormField
              control={form.control}
              name="appointmentTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de consulta</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : v)
                    }
                    value={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue placeholder="Selecione o tipo (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Outro / Personalizado</SelectItem>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.durationInMinutes} min – R${" "}
                          {(type.priceInCents / 100).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Ao selecionar um tipo, duração e valor são preenchidos
                    automaticamente.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.floatValue);
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  thousandSeparator="."
                  prefix="R$ "
                  allowNegative={false}
                  disabled={!selectedDoctorId}
                  customInput={Input}
                  className="h-11 rounded-xl"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        disabled={!isDateTimeEnabled}
                        className={cn(
                          "h-11 w-full justify-start rounded-xl text-left font-normal border-primary/20 hover:bg-primary/5",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        dayjs(date).startOf("day").isBefore(dayjs().startOf("day")) ||
                        !isDateAvailable(date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isDateTimeEnabled || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimes?.data?.map((time) => (
                      <SelectItem
                        key={time.value}
                        value={time.value}
                        disabled={!time.available}
                      >
                        {time.label} {!time.available && "(Indisponível)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationInMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                  disabled={!isDateTimeEnabled}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Duração" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 h</SelectItem>
                    <SelectItem value="90">1h 30</SelectItem>
                    <SelectItem value="120">2 h</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurrenceCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recorrência</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 rounded-xl"
                    type="number"
                    min={1}
                    max={260}
                    step={1}
                    inputMode="numeric"
                    disabled={!isDateTimeEnabled}
                    value={field.value}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const next =
                        Number.isFinite(raw) && raw > 0 ? raw : 1;
                      field.onChange(Math.min(260, Math.max(1, next)));
                    }}
                    placeholder="Ex.: 8"
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  {field.value > 1
                    ? `Serão criadas ${field.value} consultas (para aula coletiva, normalmente toda semana).`
                    : "Use 2 ou mais para criar uma série."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {recurrenceCount > 1 && (
            <>
              <FormField
                control={form.control}
                name="recurrenceWeekDays"
                render={({ field }) => {
                  const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                  return (
                    <FormItem>
                      <FormLabel>Repetir nos dias</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAY_LABELS.map((label, dayIndex) => {
                            const checked = field.value.includes(dayIndex);
                            return (
                              <Button
                                key={dayIndex}
                                type="button"
                                variant={checked ? "default" : "outline"}
                                size="sm"
                                className={checked ? "bg-gradient-to-r from-indigo-600 to-cyan-600" : "border-primary/20 hover:bg-primary/5"}
                                onClick={() => {
                                  const next = checked
                                    ? field.value.filter((d) => d !== dayIndex)
                                    : [...field.value, dayIndex].sort((a, b) => a - b);
                                  field.onChange(next);
                                }}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        Selecione um ou mais dias. A série usará a data inicial como referência.
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="recurrenceIntervalWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v) as 1 | 2)}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Toda semana</SelectItem>
                        <SelectItem value="2">Semana sim, semana não</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-muted-foreground text-xs">
                Serão criadas {recurrenceCount} consultas no mesmo horário
                {form.watch("recurrenceIntervalWeeks") === 2
                  ? ", em semanas alternadas."
                  : ", uma por semana."}
              </p>
            </>
          )}

          <FormField
            control={form.control}
            name="sendWhatsAppConfirmation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="border-primary ring-offset-background focus-visible:ring-ring mt-1 size-4 shrink-0 rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  />
                </FormControl>
                <div>
                  <FormLabel className="font-normal cursor-pointer">
                    Enviar confirmação por WhatsApp
                  </FormLabel>
                  <p className="text-muted-foreground text-xs">
                    Paciente receberá mensagem com data e horário. Configure a API
                    Twilio no .env. No sandbox, o paciente precisa ter enviado
                    "join [código]" ao número do sandbox antes.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={createAppointmentAction.isPending}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
            >
              {createAppointmentAction.isPending
                ? "Criando..."
                : (form.watch("recurrenceCount") ?? 1) > 1
                  ? `Criar ${form.watch("recurrenceCount")} agendamentos`
                  : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddAppointmentForm;
