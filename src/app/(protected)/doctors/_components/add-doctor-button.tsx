"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const AddDoctorButton = () => {
  return (
    <Button
      asChild
      className="bg-gradient-to-r from-indigo-600 to-cyan-600 font-medium shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-indigo-500/30"
    >
      <Link href="/doctors/novo">
        <Plus className="size-4" />
        Adicionar profissional
      </Link>
    </Button>
  );
};

export default AddDoctorButton;
