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
        <Button className="bg-gradient-to-r from-clinic-primary to-clinic-secondary shadow-md hover:brightness-95">
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
