"use client";

import { AlertTriangle, Mail, Phone, User } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "./upsert-patient-form";

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect;
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const [isUpsertPatientDialogOpen, setIsUpsertPatientDialogOpen] =
    useState(false);

  const patientInitials = patient.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    // Format as (XX) XXXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getSexLabel = (sex: "male" | "female") => {
    return sex === "male" ? "Masculino" : "Feminino";
  };

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10">
      {patient.allergiesRestrictions?.trim() && (
        <div className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 flex items-start gap-2 rounded-t-2xl border-b px-4 py-2.5">
          <AlertTriangle className="text-amber-600 dark:text-amber-500 mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
              Alergias / restrições
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs">
              {patient.allergiesRestrictions}
            </p>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-12 ring-2 ring-background shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-semibold text-white">
              {patientInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{patient.name}</h3>
            <p className="text-muted-foreground text-sm">
              {getSexLabel(patient.sex)}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit border-0 bg-indigo-500/10 text-indigo-700">
          <Mail className="mr-1 size-3" />
          {patient.email}
        </Badge>
        <Badge variant="secondary" className="w-fit border-0 bg-indigo-500/10 text-indigo-700">
          <Phone className="mr-1 size-3" />
          {formatPhoneNumber(patient.phoneNumber)}
        </Badge>
        <Badge variant="secondary" className="w-fit border-0 bg-muted">
          <User className="mr-1 size-3" />
          {getSexLabel(patient.sex)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2">
        <Dialog
          open={isUpsertPatientDialogOpen}
          onOpenChange={setIsUpsertPatientDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700">
              Ver detalhes
            </Button>
          </DialogTrigger>
          <UpsertPatientForm
            patient={patient}
            onSuccess={() => setIsUpsertPatientDialogOpen(false)}
            isOpen={isUpsertPatientDialogOpen}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;
