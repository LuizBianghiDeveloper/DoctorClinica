"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const AddDoctorButton = () => {
  return (
    <Button
      asChild
      className="bg-gradient-to-r from-clinic-primary to-clinic-secondary font-medium shadow-md shadow-clinic-primary/25 transition-all hover:brightness-95 hover:shadow-lg hover:shadow-clinic-primary/30"
    >
      <Link href="/doctors/novo">
        <Plus className="size-4" />
        Adicionar profissional
      </Link>
    </Button>
  );
};

export default AddDoctorButton;
