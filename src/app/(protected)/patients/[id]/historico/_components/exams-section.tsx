"use client";

import { Loader2, Plus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatientExam } from "@/actions/delete-patient-exam";
import { upsertPatientExam } from "@/actions/upsert-patient-exam";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Exam = {
  id: string;
  name: string;
  status: "requested" | "pending" | "done" | "cancelled";
};

const STATUS_LABELS: Record<Exam["status"], string> = {
  requested: "Solicitado",
  pending: "Pendente",
  done: "Realizado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<Exam["status"], string> = {
  requested: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface ExamsSectionProps {
  appointmentId: string;
  patientId: string;
  exams: Exam[];
}

export function ExamsSection({
  appointmentId,
  patientId,
  exams,
}: ExamsSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newExamName, setNewExamName] = useState("");

  const upsertAction = useAction(upsertPatientExam, {
    onSuccess: () => {
      toast.success("Exame salvo.");
      setNewExamName("");
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error("Erro ao salvar exame."),
  });

  const deleteAction = useAction(deletePatientExam, {
    onSuccess: () => {
      toast.success("Exame excluído.");
      router.refresh();
    },
    onError: () => toast.error("Erro ao excluir exame."),
  });

  const handleAddExam = () => {
    if (!newExamName.trim()) return;
    upsertAction.execute({
      appointmentId,
      patientId,
      name: newExamName.trim(),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Exames solicitados</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="size-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar exame</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do exame (ex: Hemograma)"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddExam()}
              />
              <Button
                onClick={handleAddExam}
                disabled={!newExamName.trim() || upsertAction.isExecuting}
              >
                {upsertAction.isExecuting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {exams.length > 0 ? (
        <ul className="space-y-2">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm"
            >
              <div className="flex flex-1 items-center gap-2">
                <span>{exam.name}</span>
                <Badge className={STATUS_COLORS[exam.status]}>
                  {STATUS_LABELS[exam.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={exam.status}
                  onValueChange={(value) =>
                    upsertAction.execute({
                      id: exam.id,
                      appointmentId,
                      patientId,
                      name: exam.name,
                      status: value as Exam["status"],
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteAction.execute({ examId: exam.id })}
                  disabled={deleteAction.isExecuting}
                >
                  <XCircle className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">Nenhum exame solicitado.</p>
      )}
    </div>
  );
}
