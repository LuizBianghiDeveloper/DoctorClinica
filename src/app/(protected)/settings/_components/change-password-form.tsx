"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  userEmail: string;
}

export function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (values: ChangePasswordValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (error) {
        toast.error(
          error.message ?? "Erro ao alterar senha. Verifique a senha atual.",
        );
        return;
      }

      toast.success("Senha alterada com sucesso.");
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-primary to-clinic-secondary text-white shadow-md">
            <Lock className="size-5" />
          </div>
          <div>
            <CardTitle>Alterar senha</CardTitle>
            <CardDescription>
              Use uma senha forte com pelo menos 8 caracteres
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          Conta: <span className="font-medium text-foreground">{userEmail}</span>
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Digite sua senha atual"
                      className="h-11 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mín. 8 caracteres"
                      className="h-11 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      className="h-11 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Alterar senha"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
