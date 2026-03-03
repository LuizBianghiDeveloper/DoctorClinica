"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  appointmentTypesTable,
  doctorsTable,
  patientsTable,
  roomsTable,
} from "@/db/schema";

import AddAppointmentForm from "./add-appointment-form";

type AppointmentType = typeof appointmentTypesTable.$inferSelect;
type Room = typeof roomsTable.$inferSelect;

interface AddAppointmentButtonProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  appointmentTypes: AppointmentType[];
  rooms: Room[];
}

const AddAppointmentButton = ({
  patients,
  doctors,
  appointmentTypes,
  rooms,
}: AddAppointmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-clinic-primary to-clinic-secondary hover:brightness-95 shadow-md">
          <Plus />
          Novo agendamento
        </Button>
      </DialogTrigger>
      <AddAppointmentForm
        isOpen={isOpen}
        patients={patients}
        doctors={doctors}
        appointmentTypes={appointmentTypes}
        rooms={rooms}
        onSuccess={() => setIsOpen(false)}
      />
    </Dialog>
  );
};

export default AddAppointmentButton;
