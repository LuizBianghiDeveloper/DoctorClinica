"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertRoom } from "@/actions/upsert-room";
import type { UpsertRoomSchema } from "@/actions/upsert-room/schema";
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

type Room = {
  id: string;
  name: string;
  type: "room" | "equipment";
  displayOrder: number;
};

interface UpsertRoomFormProps {
  isOpen: boolean;
  room?: Room | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório." }),
  type: z.enum(["room", "equipment"]),
  displayOrder: z.coerce.number().int().min(0),
});

export function UpsertRoomForm({
  isOpen,
  room,
  onSuccess,
}: UpsertRoomFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "room",
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: room?.name ?? "",
        type: room?.type ?? "room",
        displayOrder: room?.displayOrder ?? 0,
      });
    }
  }, [isOpen, room, form]);

  const upsertAction = useAction(upsertRoom, {
    onSuccess: () => {
      toast.success(room ? "Sala atualizada." : "Sala criada.");
      onSuccess?.();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao salvar.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: UpsertRoomSchema = {
      ...values,
      id: room?.id,
    };
    upsertAction.execute(payload);
  };

  return (
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{room ? "Editar sala/recurso" : "Nova sala/recurso"}</DialogTitle>
        <DialogDescription>
          Cadastre consultórios ou equipamentos para evitar conflitos de uso.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="Ex.: Consultório 1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="room">Consultório / Sala</SelectItem>
                    <SelectItem value="equipment">Equipamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de exibição</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 rounded-xl"
                    type="number"
                    min={0}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertAction.isPending}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
            >
              {upsertAction.isPending ? "Salvando..." : room ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
