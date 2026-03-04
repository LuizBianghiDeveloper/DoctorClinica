"use client";

import { createContext, useCallback, useContext, useState } from "react";

type AppointmentForNotes = {
  id: string;
  date: Date;
  notes: string | null;
  patient: { name: string };
  doctor?: { name: string };
};

type AppointmentNotesContextValue = {
  openNotes: (appointment: AppointmentForNotes) => void;
  notesAppointment: AppointmentForNotes | null;
  notesSheetOpen: boolean;
  setNotesSheetOpen: (open: boolean) => void;
};

const AppointmentNotesContext = createContext<AppointmentNotesContextValue | null>(
  null,
);

export function AppointmentNotesProvider({ children }: { children: React.ReactNode }) {
  const [notesAppointment, setNotesAppointment] = useState<AppointmentForNotes | null>(null);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);

  const openNotes = useCallback((appointment: AppointmentForNotes) => {
    setNotesAppointment(appointment);
    setNotesSheetOpen(true);
  }, []);

  return (
    <AppointmentNotesContext.Provider
      value={{
        openNotes,
        notesAppointment,
        notesSheetOpen,
        setNotesSheetOpen,
      }}
    >
      {children}
    </AppointmentNotesContext.Provider>
  );
}

export function useAppointmentNotes() {
  const ctx = useContext(AppointmentNotesContext);
  if (!ctx) {
    throw new Error("useAppointmentNotes must be used within AppointmentNotesProvider");
  }
  return ctx;
}
