"use client";

import { MoreHorizontal, Pencil, Users, Power, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setJobOpeningStatusAction } from "@/features/jobs/actions";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { useJobsPage } from "./jobs-page-client";

interface JobRowActionsProps {
  job: JobOpeningListItem;
}

export function JobRowActions({ job }: JobRowActionsProps) {
  const { onViewApplicants } = useJobsPage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-[#64748d] hover:text-[#061b31]"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={`/jobs/${job.id}/edit` as any} className="flex cursor-pointer items-center">
            <Pencil className="mr-2 h-4 w-4 text-[#533afd]" />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <form
            action={setJobOpeningStatusAction.bind(
              null,
              job.id,
              job.status === "open" ? "closed" : "open"
            )}
            className="w-full"
          >
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm"
            >
              <Power className="mr-2 h-4 w-4 text-[#64748d]" />
              <span>{job.status === "open" ? "Close" : "Open"}</span>
            </button>
          </form>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onViewApplicants(job)}>
          <Users className="mr-2 h-4 w-4 text-[#533afd]" />
          <span>View Applicants</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
