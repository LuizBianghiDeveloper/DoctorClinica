"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertPatientForm from "./upsert-patient-form";

const AddPatientButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-cyan-600 font-medium shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-indigo-500/30">
          <Plus className="size-4" />
          Adicionar paciente
        </Button>
      </DialogTrigger>
      <UpsertPatientForm onSuccess={() => setIsOpen(false)} isOpen={isOpen} />
    </Dialog>
  );
};

export default AddPatientButton;
