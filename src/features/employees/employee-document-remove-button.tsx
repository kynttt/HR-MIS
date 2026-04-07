"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import { deleteEmployeeDocumentAction } from "./actions";

type EmployeeDocumentRemoveButtonProps = {
  employeeId: string;
  documentId: string;
  fileName: string;
  onRemoved?: () => void;
};

export function EmployeeDocumentRemoveButton({
  employeeId,
  documentId,
  fileName,
  onRemoved
}: EmployeeDocumentRemoveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("employee_id", employeeId);
      formData.append("document_id", documentId);
      const result = await deleteEmployeeDocumentAction(formData);

      if (!result.ok) {
        return;
      }

      setOpen(false);
      onRemoved?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-[#b42318] transition-colors hover:text-[#912018]"
        >
          Remove
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove file?</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-medium text-[#273951]">{fileName}</span> from this employee profile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="bg-[#b42318] text-white hover:bg-[#912018]"
          >
            {isPending ? "Removing..." : "Confirm Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
