"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { upsertAppointmentDiagnosis } from "@/actions/upsert-appointment-diagnosis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
type Diagnosis = { id: string; icdCode: string; description: string };

interface DiagnosesSectionProps {
  appointmentId: string;
  diagnoses: Diagnosis[];
}

export function DiagnosesSection({
  appointmentId,
  diagnoses,
}: DiagnosesSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    diagnoses.length > 0
      ? diagnoses.map((d) => ({ icdCode: d.icdCode, description: d.description }))
      : [{ icdCode: "", description: "" }],
  );

  useEffect(() => {
    if (open) {
      setItems(
        diagnoses.length > 0
          ? diagnoses.map((d) => ({ icdCode: d.icdCode, description: d.description }))
          : [{ icdCode: "", description: "" }],
      );
    }
  }, [open, diagnoses]);

  const action = useAction(upsertAppointmentDiagnosis, {
    onSuccess: () => {
      toast.success("Diagnósticos atualizados.");
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error("Erro ao salvar diagnósticos."),
  });

  const addRow = () => setItems([...items, { icdCode: "", description: "" }]);
  const removeRow = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: "icdCode" | "description", value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const handleSubmit = () => {
    const valid = items.filter((d) => d.icdCode.trim() && d.description.trim());
    if (valid.length === 0 && items.some((d) => d.icdCode || d.description)) {
      toast.error("Preencha código CID e descrição.");
      return;
    }
    action.execute({
      appointmentId,
      diagnoses: valid.map((d) => ({
        icdCode: d.icdCode.trim(),
        description: d.description.trim(),
      })),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Diagnósticos (CID-10)</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="size-4" />
              {diagnoses.length > 0 ? "Editar" : "Adicionar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Diagnósticos CID-10</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Código (ex: J00)"
                    value={item.icdCode}
                    onChange={(e) => updateRow(i, "icdCode", e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Descrição"
                    value={item.description}
                    onChange={(e) => updateRow(i, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={items.length === 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-4" />
                Adicionar diagnóstico
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={action.isExecuting}
                className="w-full"
              >
                {action.isExecuting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {diagnoses.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
          {diagnoses.map((d) => (
            <li key={d.id}>
              <span className="font-mono font-medium">{d.icdCode}</span>
              {" - "}
              <span className="text-muted-foreground">{d.description}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">Nenhum diagnóstico registrado.</p>
      )}
    </div>
  );
}
