"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteRoom } from "@/actions/delete-room";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { roomsTable } from "@/db/schema";

import { UpsertRoomForm } from "./upsert-room-form";

type Room = typeof roomsTable.$inferSelect;

interface RoomsListProps {
  rooms: Room[];
}

export default function RoomsList({ rooms }: RoomsListProps) {
  const router = useRouter();
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteAction = useAction(deleteRoom, {
    onSuccess: () => {
      toast.success("Sala removida.");
      setDeleteId(null);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao remover.");
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteAction.execute({ id: deleteId });
    }
  };

  const typeLabel = (type: "room" | "equipment") =>
    type === "room" ? "Consultório/Sala" : "Equipamento";

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="rounded-2xl border-border/60 shadow-xl shadow-primary/5 transition-shadow hover:shadow-2xl hover:shadow-primary/10"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {typeLabel(room.type)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog
                    open={editingRoom?.id === room.id}
                    onOpenChange={(open) =>
                      setEditingRoom(open ? room : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-primary/20 hover:bg-primary/5"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <UpsertRoomForm
                      isOpen={editingRoom?.id === room.id}
                      room={room}
                      onSuccess={() => {
                        setEditingRoom(null);
                        router.refresh();
                      }}
                    />
                  </Dialog>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(room.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card className="rounded-2xl border-dashed border-border/60 bg-muted/20 py-12">
            <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-muted-foreground max-w-sm">
                Nenhuma sala ou recurso cadastrada. Adicione consultórios ou
                equipamentos para evitar conflitos de uso nos agendamentos.
              </p>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95">
                    <Plus />
                    Nova sala/recurso
                  </Button>
                </DialogTrigger>
                <UpsertRoomForm
                  isOpen={addOpen}
                  onSuccess={() => {
                    setAddOpen(false);
                    router.refresh();
                  }}
                />
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sala/recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os agendamentos que usavam esta
              sala terão o campo de sala removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 hover:bg-primary/5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
