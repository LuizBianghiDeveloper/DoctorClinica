"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateUser } from "@/actions/update-user";
import { updateUserSchema } from "@/actions/update-user/schema";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditUserFormProps {
  member: Member;
  onSuccess?: () => void;
}

export default function EditUserForm({
  member,
  onSuccess,
}: EditUserFormProps) {
  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      userId: member.id,
      name: member.name,
      email: member.email,
      role: member.role as "admin" | "user",
      password: "",
    },
  });

  const updateUserAction = useAction(updateUser, {
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso.");
      form.reset({
        userId: member.id,
        name: form.getValues("name"),
        email: form.getValues("email"),
        role: form.getValues("role"),
        password: "",
      });
      onSuccess?.();
    },
    onError: ({ error }) => {
      const message =
        error.serverError ??
        (error.validationErrors
          ? "Verifique os dados do formulário."
          : null) ??
        "Erro ao atualizar usuário.";
      toast.error(message);
    },
  });

  const onSubmit = (values: z.infer<typeof updateUserSchema>) => {
    updateUserAction.execute({
      ...values,
      password: values.password?.trim() || undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Editar usuário</DialogTitle>
        <DialogDescription>
          Altere as informações do usuário. Deixe a senha em branco para
          mantê-la.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="Nome completo"
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
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha (opcional)</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 rounded-xl"
                    type="password"
                    placeholder="Deixe em branco para manter"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={updateUserAction.isExecuting}
              className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
            >
              {updateUserAction.isExecuting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
