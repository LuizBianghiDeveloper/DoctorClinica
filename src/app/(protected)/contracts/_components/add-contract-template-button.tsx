"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UpsertContractTemplateForm } from "./upsert-contract-template-form";

export default function AddContractTemplateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-indigo-600 to-cyan-600 font-medium shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-indigo-500/30"
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
