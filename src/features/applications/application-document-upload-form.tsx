"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

import { uploadApplicationDocumentAction } from "./actions";

export function ApplicationDocumentUploadForm({ applicationId }: { applicationId: string }) {
  const [documentType, setDocumentType] = useState("resume");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
      <h3 className="text-sm font-semibold text-[#061b31]">Upload Application Document</h3>
      <Select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
        <option value="resume">Resume</option>
        <option value="diploma">Diploma</option>
        <option value="tor">TOR</option>
        <option value="certificates">Certificates</option>
        <option value="prc_license">PRC/License</option>
        <option value="contract">Contract</option>
        <option value="other">Other</option>
      </Select>
      <input className="block w-full text-sm" ref={fileRef} type="file" />
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <Button
        disabled={isPending}
        onClick={() => {
          const file = fileRef.current?.files?.[0];
          if (!file) {
            setMessage("Select a file first.");
            return;
          }

          startTransition(async () => {
            const formData = new FormData();
            formData.append("application_id", applicationId);
            formData.append("document_type", documentType);
            formData.append("file", file);

            const result = await uploadApplicationDocumentAction(formData);
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            if (fileRef.current) {
              fileRef.current.value = "";
            }
            setMessage("Document uploaded.");
          });
        }}
        type="button"
      >
        {isPending ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
