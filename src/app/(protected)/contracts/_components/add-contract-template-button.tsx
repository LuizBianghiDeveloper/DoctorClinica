"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { UpsertContractTemplateForm } from "./upsert-contract-template-form";

export default function AddContractTemplateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-clinic-primary to-clinic-secondary font-medium shadow-md shadow-clinic-primary/25 transition-all hover:brightness-95 hover:shadow-lg hover:shadow-clinic-primary/30"
      >
        <Plus className="mr-2 size-4" />
        Novo modelo
      </Button>
      <UpsertContractTemplateForm
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={() => setIsOpen(false)}
      />
    </>
  );
}
