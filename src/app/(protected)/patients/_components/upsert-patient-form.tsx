"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientsTable } from "@/db/schema";

import { CameraCaptureDialog } from "./camera-capture-dialog";

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  birthDate: z.string().optional(),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  photoUrl: z.string().optional(),
  allergiesRestrictions: z.string().optional(),
});

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

const UpsertPatientForm = ({
  patient,
  onSuccess,
  isOpen,
}: UpsertPatientFormProps) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      phoneNumber: patient?.phoneNumber ?? "",
      birthDate: patient?.birthDate
        ? String(patient.birthDate).slice(0, 10)
        : "",
      sex: patient?.sex ?? undefined,
      rg: patient?.rg ?? "",
      cpf: patient?.cpf ?? "",
      photoUrl: patient?.photoUrl ?? "",
      allergiesRestrictions: patient?.allergiesRestrictions ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: patient?.name ?? "",
        email: patient?.email ?? "",
        phoneNumber: patient?.phoneNumber ?? "",
        birthDate: patient?.birthDate
          ? String(patient.birthDate).slice(0, 10)
          : "",
        sex: patient?.sex ?? undefined,
        rg: patient?.rg ?? "",
        cpf: patient?.cpf ?? "",
        photoUrl: patient?.photoUrl ?? "",
        allergiesRestrictions: patient?.allergiesRestrictions ?? "",
      });
    }
  }, [isOpen, form, patient]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success("Paciente salvo com sucesso.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao salvar paciente.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertPatientAction.execute({
      ...values,
      id: patient?.id,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {patient ? patient.name : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {patient
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do paciente</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite o nome completo do paciente"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de telefone</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="(##) #####-####"
                    mask="_"
                    placeholder="(11) 99999-9999"
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value.value);
                    }}
                    customInput={Input}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do RG" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="###.###.###-##"
                      mask="_"
                      placeholder="000.000.000-00"
                      value={field.value ?? ""}
                      onValueChange={(value) => field.onChange(value.value)}
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
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto</FormLabel>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      field.value && setPreviewPhoto(field.value)
                    }
                    className={`rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring ${field.value ? "cursor-pointer" : ""}`}
                  >
                    <Avatar className="size-16">
                      <AvatarImage src={field.value ?? undefined} alt="" />
                      <AvatarFallback className="text-lg">
                        {form.watch("name")?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-[180px]"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file || file.size > 500 * 1024) {
                              if (file && file.size > 500 * 1024) {
                                toast.error(
                                  "A imagem deve ter no máximo 500KB.",
                                );
                              }
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              field.onChange(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCameraOpen(true)}
                      >
                        <Camera className="mr-2 size-4" />
                        Tirar foto
                      </Button>
                    </div>
                    <CameraCaptureDialog
                      isOpen={cameraOpen}
                      onOpenChange={setCameraOpen}
                      onCapture={(dataUrl) => field.onChange(dataUrl)}
                    />
                    {field.value && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={() => field.onChange("")}
                      >
                        Remover foto
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Envie um arquivo ou tire uma foto pela webcam. Clique na foto
                  para ampliar. PNG, JPG ou GIF. Máximo 500KB.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto p-2">
              {previewPhoto && (
                <img
                  src={previewPhoto}
                  alt="Foto do paciente"
                  className="max-h-[85vh] w-auto object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
          <FormField
            control={form.control}
            name="allergiesRestrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alergias / restrições</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex.: Penicilina, látex, dipirona..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Alertas serão exibidos na ficha do paciente e no agendamento.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertPatientAction.isPending}
              className="w-full bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
            >
              {upsertPatientAction.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
