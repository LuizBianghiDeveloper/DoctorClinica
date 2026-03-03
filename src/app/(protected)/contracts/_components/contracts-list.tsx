"use client";

import dayjs from "dayjs";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteContractTemplate } from "@/actions/delete-contract-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { contractTemplatesTable } from "@/db/schema";
import type { ContractVariables } from "@/lib/contract-pdf";
import { generateContractPDF } from "@/lib/contract-pdf";

import AddContractTemplateButton from "./add-contract-template-button";
import { UpsertContractTemplateForm } from "./upsert-contract-template-form";

interface ContractsListProps {
  templates: (typeof contractTemplatesTable.$inferSelect)[];
  clinicName: string;
  patients?: { id: string; name: string; email: string; phoneNumber: string; birthDate: string | null }[];
}

export default function ContractsList({
  templates,
  clinicName,
  patients = [],
}: ContractsListProps) {
  const [editingTemplate, setEditingTemplate] = useState<
    (typeof templates)[0] | null
  >(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof templates)[0] | null
  >(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const deleteAction = useAction(deleteContractTemplate, {
    onSuccess: () => toast.success("Modelo removido."),
    onError: ({ error }) => toast.error(error.serverError ?? "Erro ao remover."),
  });

  const handleGenerate = () => {
    if (!selectedTemplate || !selectedPatientId) return;
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const variables: ContractVariables = {
      paciente_nome: patient.name,
      paciente_email: patient.email,
      paciente_telefone: patient.phoneNumber,
      paciente_nascimento: patient.birthDate
        ? dayjs(patient.birthDate).format("DD/MM/YYYY")
        : "",
      data_hoje: dayjs().format("DD/MM/YYYY"),
      clinica_nome: clinicName,
    };
    generateContractPDF(selectedTemplate.name, selectedTemplate.content, variables);
    setGenerateDialogOpen(false);
    setSelectedTemplate(null);
    setSelectedPatientId("");
  };

  return (
    <>
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-clinic-primary/20 to-clinic-secondary/20">
              <FileText className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Nenhum modelo de contrato cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">
              Crie um modelo para começar a gerar contratos em PDF.
            </p>
            <AddContractTemplateButton />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="overflow-hidden rounded-2xl border shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-primary to-clinic-secondary text-white shadow-md">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-primary/5 hover:text-primary"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteAction.execute({ id: template.id })}
                      disabled={deleteAction.status === "executing"}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {template.content.slice(0, 100)}...
                  </p>
                  <Button
                    className="mt-4 w-full border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setGenerateDialogOpen(true);
                    }}
                  >
                    <FileText className="mr-2 size-4" />
                    Gerar PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <UpsertContractTemplateForm
        isOpen={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSuccess={() => setEditingTemplate(null)}
        template={editingTemplate ?? undefined}
      />

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar contrato em PDF</DialogTitle>
            <DialogDescription>
              Selecione o modelo e o paciente para gerar o contrato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                Paciente
              </label>
              {patients.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum paciente cadastrado. Cadastre pacientes em Pacientes
                  para gerar contratos.
                </p>
              ) : (
                <Select
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95"
              onClick={handleGenerate}
              disabled={!selectedPatientId || patients.length === 0}
            >
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
