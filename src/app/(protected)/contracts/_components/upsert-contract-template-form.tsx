"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertContractTemplate } from "@/actions/upsert-contract-template";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório."),
  content: z.string().min(1, "Conteúdo é obrigatório."),
});

interface UpsertContractTemplateFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  template?: {
    id: string;
    name: string;
    content: string;
  };
}

export function UpsertContractTemplateForm({
  isOpen,
  onOpenChange,
  onSuccess,
  template,
}: UpsertContractTemplateFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name ?? "",
      content:
        template?.content ??
        `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento, {{clinica_nome}}, neste ato representada, e {{paciente_nome}}, portador do e-mail {{paciente_email}} e telefone {{paciente_telefone}}, nascido em {{paciente_nascimento}}, celebram o presente contrato de prestação de serviços médicos.

Data: {{data_hoje}}`,
    },
  });

  useEffect(() => {
    if (isOpen && template) {
      form.reset({
        name: template.name,
        content: template.content,
      });
    } else if (isOpen && !template) {
      form.reset({
        name: "",
        content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento, {{clinica_nome}}, neste ato representada, e {{paciente_nome}}, portador do e-mail {{paciente_email}} e telefone {{paciente_telefone}}, nascido em {{paciente_nascimento}}, celebram o presente contrato de prestação de serviços médicos.

Data: {{data_hoje}}`,
      });
    }
  }, [isOpen, template, form]);

  const upsertAction = useAction(upsertContractTemplate, {
    onSuccess: () => {
      toast.success(
        template ? "Modelo atualizado com sucesso." : "Modelo criado com sucesso.",
      );
      onSuccess?.();
      onOpenChange(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao salvar modelo.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertAction.execute({
      id: template?.id,
      name: values.name,
      content: values.content,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar modelo" : "Novo modelo de contrato"}
          </DialogTitle>
          <DialogDescription>
            Use as variáveis entre chaves duplas:{" "}
            {`{{paciente_nome}}, {{paciente_email}}, {{paciente_telefone}}, {{paciente_nascimento}}, {{data_hoje}}, {{clinica_nome}}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do modelo</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Ex: Contrato de atendimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conteúdo do contrato..."
                      className="min-h-[200px] rounded-xl font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 hover:bg-primary/5"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={upsertAction.status === "executing"}
                className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
              >
                {upsertAction.status === "executing"
                  ? "Salvando..."
                  : template
                    ? "Atualizar"
                    : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
