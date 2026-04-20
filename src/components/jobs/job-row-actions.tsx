"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { setJobOpeningStatusAction } from "@/features/jobs/actions";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { useJobsPage } from "./jobs-page-client";

interface JobRowActionsProps {
  job: JobOpeningListItem;
}

export function JobRowActions({ job }: JobRowActionsProps) {
  const { onViewApplicants } = useJobsPage();

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link
        href={`/jobs/${job.id}/edit` as any}
        className="text-xs text-brand-700 hover:text-brand-500"
      >
        Edit
      </Link>
      <span className="text-[#e5edf5]">|</span>
      <form action={setJobOpeningStatusAction.bind(null, job.id, job.status === "open" ? "closed" : "open")}>
        <button className="text-xs text-[#64748d] hover:text-[#061b31]" type="submit">
          {job.status === "open" ? "Close" : "Open"}
        </button>
      </form>
      <span className="text-[#e5edf5]">|</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto gap-1 p-0 text-xs text-[#533afd] hover:text-[#4434d4]"
        onClick={() => onViewApplicants(job)}
      >
        <Users className="h-3 w-3" />
        View Applicants
      </Button>
    </div>
  );
}
