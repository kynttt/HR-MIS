"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type JobsPageToastProps = {
  updated: boolean;
  created: boolean;
};

export function JobsPageToast({ updated, created }: JobsPageToastProps) {
  const router = useRouter();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) {
      return;
    }

    if (created) {
      shownRef.current = true;
      toast.success("Job opening created successfully.");
      router.replace("/jobs");
      return;
    }

    if (updated) {
      shownRef.current = true;
      toast.success("Job opening updated successfully.");
      router.replace("/jobs");
    }
  }, [created, updated, router]);

  return null;
}
