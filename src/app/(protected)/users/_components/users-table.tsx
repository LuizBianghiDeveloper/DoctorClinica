"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/update-user-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  members: Member[];
  isAdmin: boolean;
}

export default function UsersTable({ members, isAdmin }: UsersTableProps) {
  const updateRoleAction = useAction(updateUserRole, {
    onSuccess: () => toast.success("Grupo atualizado."),
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Erro ao atualizar grupo."),
  });

  const handleRoleChange = (userId: string, role: "admin" | "user") => {
    updateRoleAction.execute({ userId, role });
  };

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 3 : 2}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
