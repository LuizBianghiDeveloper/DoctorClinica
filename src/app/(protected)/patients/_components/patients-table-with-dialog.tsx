"use client";

import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { patientsTable } from "@/db/schema";

import PatientsTableActions from "./table-actions";
import UpsertPatientForm from "./upsert-patient-form";

type Patient = typeof patientsTable.$inferSelect;

interface PatientsTableWithDialogProps {
  patients: Patient[];
}

export function PatientsTableWithDialog({ patients }: PatientsTableWithDialogProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  }, []);

  const columns: ColumnDef<Patient>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Nome",
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
      },
      {
        id: "phoneNumber",
        accessorKey: "phoneNumber",
        header: "Telefone",
        cell: (params) => {
          const patient = params.row.original;
          const phoneNumber = patient.phoneNumber;
          if (!phoneNumber) return "";
          const formatted = phoneNumber.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3",
          );
          return formatted;
        },
      },
      {
        id: "birthDate",
        accessorKey: "birthDate",
        header: "Data de nascimento",
        cell: (params) => {
          const value = params.row.original.birthDate;
          if (!value) return "—";
          return dayjs(value).format("DD/MM/YYYY");
        },
      },
      {
        id: "sex",
        accessorKey: "sex",
        header: "Sexo",
        cell: (params) => {
          const patient = params.row.original;
          return patient.sex === "male" ? "Masculino" : "Feminino";
        },
      },
      {
        id: "allergiesRestrictions",
        accessorKey: "allergiesRestrictions",
        header: "Alergias",
        cell: (params) => {
          const value = params.row.original.allergiesRestrictions;
          return value?.trim() ? (
            <span className="text-amber-600 dark:text-amber-500 text-xs">
              ⚠ {value.length > 40 ? `${value.slice(0, 40)}...` : value}
            </span>
          ) : (
            "—"
          );
        },
      },
      {
        id: "actions",
        cell: (params) => {
          const patient = params.row.original;
          return (
            <PatientsTableActions
              patient={patient}
              onEdit={() => openEdit(patient)}
            />
          );
        },
      },
    ],
    [openEdit],
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl shadow-primary/5 [&>div]:border-0 [&>div]:rounded-none">
        <DataTable
          data={patients}
          columns={columns}
          onRowClick={openEdit}
        />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <UpsertPatientForm
          isOpen={dialogOpen}
          patient={selectedPatient ?? undefined}
          onSuccess={() => setDialogOpen(false)}
        />
      </Dialog>
    </>
  );
}
