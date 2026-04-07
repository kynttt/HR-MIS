"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateApplicationStatusAction } from "./actions";

const statuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "for_requirements",
  "accepted",
  "rejected",
  "withdrawn"
] as const;

export function ApplicationStatusForm({ applicationId, currentStatus }: { applicationId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
      <h3 className="text-sm font-semibold text-[#061b31]">Update Status</h3>
      <Select value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      <Textarea placeholder="Remarks (optional)" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setMessage(null);
            const result = await updateApplicationStatusAction({
              application_id: applicationId,
              status,
              remarks
            });

            if (!result.ok) {
              setMessage(result.error);
              return;
            }

            setMessage("Status updated.");
          });
        }}
        type="button"
      >
        {isPending ? "Saving..." : "Save Status"}
      </Button>
    </div>
  );
}
