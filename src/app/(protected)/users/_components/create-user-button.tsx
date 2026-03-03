"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import CreateUserForm from "./create-user-form";

export default function CreateUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-md hover:from-indigo-700 hover:to-cyan-700">
          <Plus />
          Novo usuário
        </Button>
      </DialogTrigger>
      <CreateUserForm
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </Dialog>
  );
}
