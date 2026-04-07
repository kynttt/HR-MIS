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

import { deleteApplicationDocumentAction } from "./actions";

type ApplicationDocumentRemoveButtonProps = {
  applicationId: string;
  documentId: string;
  fileName: string;
  onRemoved?: () => void;
};

export function ApplicationDocumentRemoveButton({
  applicationId,
  documentId,
  fileName,
  onRemoved
}: ApplicationDocumentRemoveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("application_id", applicationId);
      formData.append("document_id", documentId);
      const result = await deleteApplicationDocumentAction(formData);

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
            This will permanently delete <span className="font-medium text-[#273951]">{fileName}</span> from this application.
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
