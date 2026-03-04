"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteUserFromClinic } from "@/actions/delete-user-from-clinic";
import { updateUserRole } from "@/actions/update-user-role";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import EditUserForm from "./edit-user-form";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  members: Member[];
  isAdmin: boolean;
  currentUserId?: string;
}

export default function UsersTable({
  members,
  isAdmin,
  currentUserId,
}: UsersTableProps) {
  const [editMember, setEditMember] = useState<Member | null>(null);

  const updateRoleAction = useAction(updateUserRole, {
    onSuccess: () => toast.success("Grupo atualizado."),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Erro ao atualizar grupo."),
  });

  const deleteUserAction = useAction(deleteUserFromClinic, {
    onSuccess: () => toast.success("Usuário removido da clínica."),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Erro ao remover usuário."),
  });

  const handleRoleChange = (userId: string, role: "admin" | "user") => {
    updateRoleAction.execute({ userId, role });
  };

  const canDelete = (member: Member) =>
    isAdmin && member.id !== currentUserId;

  const getAdminCount = () =>
    members.filter((m) => m.role === "admin").length;

  return (
    <Card className="rounded-2xl border-border/60 shadow-xl shadow-primary/5">
      <CardHeader>
        <CardTitle>Usuários da clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              {isAdmin && <TableHead>Grupo</TableHead>}
              {isAdmin && <TableHead className="w-[100px]">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 4 : 2}
                  className="text-muted-foreground py-12 text-center"
                >
                  Nenhum usuário cadastrado na clínica.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value as "admin" | "user")
                        }
                        disabled={updateRoleAction.isExecuting}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog
                          open={editMember?.id === member.id}
                          onOpenChange={(open) =>
                            setEditMember(open ? member : null)
                          }
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditMember(member)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <EditUserForm
                            member={member}
                            onSuccess={() => setEditMember(null)}
                          />
                        </Dialog>
                        {canDelete(member) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={
                                  member.role === "admin" &&
                                  getAdminCount() <= 1
                                }
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remover usuário?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  O usuário {member.name} perderá acesso à
                                  clínica. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteUserAction.execute({
                                      userId: member.id,
                                    })
                                  }
                                  disabled={deleteUserAction.isExecuting}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
