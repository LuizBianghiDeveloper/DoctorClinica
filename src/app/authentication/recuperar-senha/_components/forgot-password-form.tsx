"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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

const schema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const redirectTo = `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ""}/authentication/redefinir-senha`;

    const { error } = await authClient.forgetPassword({
      email: values.email,
      redirectTo,
    });

    if (error) {
      toast.error(error.message ?? "Erro ao enviar e-mail.");
      return;
    }

    toast.success("E-mail enviado! Verifique sua caixa de entrada.");
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="h-11 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>
    </Form>
  );
}
