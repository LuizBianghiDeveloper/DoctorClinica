"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, PlusIcon, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteDoctorTimeBlock } from "@/actions/delete-doctor-time-block";
import { upsertDoctorTimeBlock } from "@/actions/upsert-doctor-time-block";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { doctorTimeBlocksTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import {
  formatTimeOption,
  TIME_OPTIONS,
  WEEK_DAY_LABELS,
} from "./schedule-time-options";

type DoctorTimeBlock = typeof doctorTimeBlocksTable.$inferSelect;

const blockTypeLabels: Record<DoctorTimeBlock["type"], string> = {
  interval: "Intervalo",
  lunch: "Almoço",
  day_off: "Folga",
};

const formSchema = z
  .object({
    type: z.enum(["interval", "lunch", "day_off"]),
    mode: z.enum(["recurring", "specific"]),
    weekDay: z.number().min(0).max(6).nullable(),
    blockDate: z.date().nullable(),
    fromTime: z.string().min(1, { message: "Horário de início obrigatório." }),
    toTime: z.string().min(1, { message: "Horário de término obrigatório." }),
  })
  .refine(
    (data) => {
      if (data.mode === "recurring") return data.weekDay != null;
      return data.blockDate != null;
    },
    { message: "Selecione o dia ou a data.", path: ["weekDay"] },
  )
  .refine((data) => data.fromTime < data.toTime, {
    message: "O horário de início deve ser anterior ao de término.",
    path: ["toTime"],
  });

type FormValues = z.infer<typeof formSchema>;

interface DoctorTimeBlocksFormProps {
  doctorId: string;
  timeBlocks: DoctorTimeBlock[];
}

export function DoctorTimeBlocksForm({
  doctorId,
  timeBlocks,
}: DoctorTimeBlocksFormProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "lunch",
      mode: "recurring",
      weekDay: 1,
      blockDate: null,
      fromTime: "12:00:00",
      toTime: "13:00:00",
    },
  });

  const mode = form.watch("mode");

  const upsertAction = useAction(upsertDoctorTimeBlock, {
    onSuccess: () => {
      toast.success("Bloqueio adicionado com sucesso.");
      setDialogOpen(false);
      form.reset({
        type: "lunch",
        mode: "recurring",
        weekDay: 1,
        blockDate: null,
        fromTime: "12:00:00",
        toTime: "13:00:00",
      });
      router.refresh();
    },
    onError: () => {
      toast.error("Erro ao adicionar bloqueio.");
    },
  });

  const deleteAction = useAction(deleteDoctorTimeBlock, {
    onSuccess: () => {
      toast.success("Bloqueio removido.");
      router.refresh();
    },
    onError: () => {
      toast.error("Erro ao remover bloqueio.");
    },
  });

  const onSubmit = (values: FormValues) => {
    upsertAction.execute({
      doctorId,
      type: values.type,
      weekDay: values.mode === "recurring" ? values.weekDay : null,
      blockDate:
        values.mode === "specific" && values.blockDate
          ? format(values.blockDate, "yyyy-MM-dd")
          : null,
      fromTime: values.fromTime,
      toTime: values.toTime,
    });
  };

  const ensureTimeFormat = (t: string) =>
    t.includes(":") && t.split(":").length >= 2
      ? `${t.split(":")[0]!.padStart(2, "0")}:${t.split(":")[1]!.padStart(2, "0")}:00`
      : t;

  const allTimeSlots = ["00:00:00", ...TIME_OPTIONS.flatMap((g) => g.slots)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
            <Clock className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">Bloqueios de horário</h3>
            <p className="text-muted-foreground text-sm">
              Intervalos, almoço ou folgas que não estarão disponíveis
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
            >
              <PlusIcon className="mr-2 size-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo bloqueio</DialogTitle>
              <DialogDescription>
                Configure intervalo, almoço ou folga. Os horários bloqueados não
                estarão disponíveis para agendamento.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="interval">
                            Intervalo
                          </SelectItem>
                          <SelectItem value="lunch">Almoço</SelectItem>
                          <SelectItem value="day_off">Folga</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recorrência</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v === "recurring") {
                            form.setValue("blockDate", null);
                            form.setValue("weekDay", 1);
                          } else {
                            form.setValue("weekDay", null);
                            form.setValue("blockDate", new Date());
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recurring">
                            Toda semana (dia fixo)
                          </SelectItem>
                          <SelectItem value="specific">
                            Data específica
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode === "recurring" && (
                  <FormField
                    control={form.control}
                    name="weekDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia da semana</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={field.value != null ? String(field.value) : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(WEEK_DAY_LABELS).map(
                              ([day, label]) => (
                                <SelectItem key={day} value={day}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {mode === "specific" && (
                  <FormField
                    control={form.control}
                    name="blockDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 size-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Das</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={ensureTimeFormat(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allTimeSlots.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTimeOption(t)}
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
                    name="toTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Até</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={ensureTimeFormat(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allTimeSlots.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTimeOption(t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/5"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={upsertAction.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                  >
                    {upsertAction.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {timeBlocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
          <Clock className="text-muted-foreground mx-auto mb-3 size-10 opacity-50" />
          <p className="text-muted-foreground text-sm">
            Nenhum bloqueio configurado
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Clique em Adicionar para criar intervalo, almoço ou folga
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {timeBlocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {blockTypeLabels[block.type]}
                </span>
                <span className="text-muted-foreground text-sm">
                  {block.weekDay != null
                    ? WEEK_DAY_LABELS[block.weekDay]
                    : block.blockDate
                      ? format(new Date(block.blockDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "-"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatTimeOption(block.fromTime)} –{" "}
                  {formatTimeOption(block.toTime)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => deleteAction.execute({ id: block.id })}
                disabled={deleteAction.isPending}
              >
                <TrashIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
