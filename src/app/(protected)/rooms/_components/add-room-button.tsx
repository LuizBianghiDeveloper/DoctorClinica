"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import { UpsertRoomForm } from "./upsert-room-form";

export default function AddRoomButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-clinic-primary to-clinic-secondary shadow-md hover:brightness-95">
          <Plus />
          Nova sala/recurso
        </Button>
      </DialogTrigger>
      <UpsertRoomForm isOpen={isOpen} onSuccess={handleSuccess} />
    </Dialog>
  );
}
