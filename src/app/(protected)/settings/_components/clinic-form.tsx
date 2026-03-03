"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertClinic } from "@/actions/upsert-clinic";
import {
  defaultFromTime,
  defaultToTime,
  formatTimeOption,
  TIME_OPTIONS,
  WEEK_DAY_LABELS,
} from "@/app/(protected)/doctors/_components/schedule-time-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clinicBusinessHoursTable,
  clinicsTable,
} from "@/db/schema";
import { authClient } from "@/lib/auth-client";

const upsertClinicSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  cnpj: z.string().trim().optional(),
  website: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  primaryColor: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^#[0-9A-Fa-f]{6}$/.test(v ?? ""),
      { message: "Ex: #4f46e5" },
    ),
  secondaryColor: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^#[0-9A-Fa-f]{6}$/.test(v ?? ""),
      { message: "Ex: #06b6d4" },
    ),
  businessHours: z.array(
    z.object({
      weekDay: z.number(),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    }),
  ),
});

type FormValues = z.infer<typeof upsertClinicSchema>;

type Clinic = typeof clinicsTable.$inferSelect;
type BusinessHour = typeof clinicBusinessHoursTable.$inferSelect;

const allTimeSlots = TIME_OPTIONS.flatMap((g) => g.slots);

interface ClinicFormProps {
  clinic: Clinic | null;
  businessHours: BusinessHour[];
}

export function ClinicForm({ clinic, businessHours }: ClinicFormProps) {
  const router = useRouter();
  const { refetch: refetchSession } = authClient.useSession();

  const getDefaultBusinessHours = (): FormValues["businessHours"] =>
    [0, 1, 2, 3, 4, 5, 6].map((weekDay) => {
      const existing = businessHours.find((h) => h.weekDay === weekDay);
      const hasAnyHours = businessHours.length > 0;
      const isClosed = hasAnyHours ? !existing : weekDay === 0 || weekDay === 6;
      return {
        weekDay,
        openTime: existing?.openTime?.toString().slice(0, 8) ?? defaultFromTime,
        closeTime: existing?.closeTime?.toString().slice(0, 8) ?? defaultToTime,
        isClosed,
      };
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(upsertClinicSchema),
    defaultValues: {
      name: clinic?.name ?? "",
      address: clinic?.address ?? "",
      phone: clinic?.phone ?? "",
      cnpj: clinic?.cnpj ?? "",
      website: clinic?.website ?? "",
      logoUrl: clinic?.logoUrl ?? "",
      primaryColor: clinic?.primaryColor ?? "",
      secondaryColor: clinic?.secondaryColor ?? "",
      businessHours: getDefaultBusinessHours(),
    },
  });

  useEffect(() => {
    if (clinic) {
      form.reset({
        name: clinic.name,
        address: clinic.address ?? "",
        phone: clinic.phone ?? "",
        cnpj: clinic.cnpj ?? "",
        website: clinic.website ?? "",
        logoUrl: clinic.logoUrl ?? "",
        primaryColor: clinic.primaryColor ?? "",
        secondaryColor: clinic.secondaryColor ?? "",
        businessHours: [0, 1, 2, 3, 4, 5, 6].map((weekDay) => {
          const existing = businessHours.find((h) => h.weekDay === weekDay);
          const hasAnyHours = businessHours.length > 0;
          const isClosed = hasAnyHours ? !existing : weekDay === 0 || weekDay === 6;
          return {
            weekDay,
            openTime: existing?.openTime?.toString().slice(0, 8) ?? defaultFromTime,
            closeTime: existing?.closeTime?.toString().slice(0, 8) ?? defaultToTime,
            isClosed,
          };
        }),
      });
    }
  }, [clinic, businessHours, form]);

  const upsertAction = useAction(upsertClinic, {
    onSuccess: async () => {
      toast.success("Dados da clínica atualizados com sucesso.");
      await refetchSession();
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao salvar.");
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      businessHours: values.businessHours.map((h) => ({
        weekDay: h.weekDay,
        openTime: h.openTime.includes(":") && h.openTime.length >= 5
          ? h.openTime.length === 5
            ? `${h.openTime}:00`
            : h.openTime
          : "08:00:00",
        closeTime: h.closeTime.includes(":") && h.closeTime.length >= 5
          ? h.closeTime.length === 5
            ? `${h.closeTime}:00`
            : h.closeTime
          : "18:00:00",
        isClosed: h.isClosed,
      })),
    };
    upsertAction.execute(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
            <CardDescription>
              Dados de contato e identificação da clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da clínica" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rua, número, bairro, cidade" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) #####-####"
                        mask="_"
                        placeholder="(11) 99999-9999"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.value)}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="##.###.###/####-##"
                        mask="_"
                        placeholder="00.000.000/0000-00"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.value)}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://www.exemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identidade visual</CardTitle>
            <CardDescription>
              Logo e cores da marca (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da logo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://exemplo.com/logo.png" />
                  </FormControl>
                  <FormDescription>
                    Cole o link de uma imagem da logo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor primária</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="h-10 w-14 cursor-pointer p-1"
                          value={field.value || "#4f46e5"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <Input
                          {...field}
                          placeholder="#4f46e5"
                          className="font-mono"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor secundária</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="h-10 w-14 cursor-pointer p-1"
                          value={field.value || "#06b6d4"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <Input
                          {...field}
                          placeholder="#06b6d4"
                          className="font-mono"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horário de funcionamento</CardTitle>
            <CardDescription>
              Defina os horários em que a clínica atende (geral)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.watch("businessHours").map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`businessHours.${index}.isClosed`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="flex flex-1 items-center gap-4">
                        <FormControl>
                          <Checkbox
                            checked={!field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(!checked)
                            }
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="cursor-pointer">
                            {WEEK_DAY_LABELS[index]}
                          </FormLabel>
                          {!field.value && (
                            <div className="mt-2 flex gap-2">
                              <FormField
                                control={form.control}
                                name={`businessHours.${index}.openTime`}
                                render={({ field: timeField }) => {
                                  const val = timeField.value ?? defaultFromTime;
                                  const displayVal =
                                    val.length === 5 ? `${val}:00` : val;
                                  return (
                                    <FormItem>
                                      <Select
                                        value={
                                          allTimeSlots.includes(displayVal)
                                            ? displayVal
                                            : defaultFromTime
                                        }
                                        onValueChange={(v) =>
                                          timeField.onChange(
                                            v.length === 5 ? `${v}:00` : v,
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[110px]">
                                          <SelectValue placeholder="Abertura" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {allTimeSlots.map((s) => (
                                            <SelectItem key={s} value={s}>
                                              {formatTimeOption(s)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  );
                                }}
                              />
                              <FormField
                                control={form.control}
                                name={`businessHours.${index}.closeTime`}
                                render={({ field: timeField }) => {
                                  const val = timeField.value ?? defaultToTime;
                                  const displayVal =
                                    val.length === 5 ? `${val}:00` : val;
                                  return (
                                    <FormItem>
                                      <Select
                                        value={
                                          allTimeSlots.includes(displayVal)
                                            ? displayVal
                                            : defaultToTime
                                        }
                                        onValueChange={(v) =>
                                          timeField.onChange(
                                            v.length === 5 ? `${v}:00` : v,
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[110px]">
                                          <SelectValue placeholder="Fechamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {allTimeSlots.map((s) => (
                                            <SelectItem key={s} value={s}>
                                              {formatTimeOption(s)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  );
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={upsertAction.status === "executing"}>
          {upsertAction.status === "executing" && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          Salvar alterações
        </Button>
      </form>
    </Form>
  );
}
