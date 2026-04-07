"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { addApplicationNoteAction } from "./actions";

export function ApplicationNoteForm({ applicationId }: { applicationId: string }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
      <h3 className="text-sm font-semibold text-[#061b31]">Add HR Note</h3>
      <Textarea placeholder="Write an internal note..." value={note} onChange={(event) => setNote(event.target.value)} />
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <Button
        disabled={isPending || note.trim().length < 2}
        onClick={() => {
          startTransition(async () => {
            setMessage(null);
            const result = await addApplicationNoteAction({
              application_id: applicationId,
              note_text: note
            });

            if (!result.ok) {
              setMessage(result.error);
              return;
            }

            setNote("");
            setMessage("Note added.");
          });
        }}
        type="button"
      >
        {isPending ? "Saving..." : "Save Note"}
      </Button>
    </div>
  );
}
