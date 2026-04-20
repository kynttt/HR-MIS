"use client";

import { Calendar, Star, CalendarCheck, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RankedApplicant } from "@/features/jobs/types";
import { AIScoreBadge } from "./ai-score-badge";

interface RankedApplicantCardProps {
  applicant: RankedApplicant;
  rank: number;
  onShortlist?: (id: string) => void;
  onInterview?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusVariants: Record<RankedApplicant["status"], "muted" | "success" | "warning" | "default" | "danger"> = {
  submitted: "muted",
  under_review: "default",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "default",
  for_requirements: "warning",
  accepted: "success",
  rejected: "muted",
  withdrawn: "muted"
};

export function RankedApplicantCard({
  applicant,
  rank,
  onShortlist,
  onInterview,
  onReject
}: RankedApplicantCardProps) {
  return (
    <div className="relative rounded-lg border border-[#e5edf5] bg-white p-4 transition-shadow hover:shadow-md">
      {/* Rank Number */}
      <div className="absolute -left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5edf5] bg-[#f6f9fc] text-xs font-medium text-[#64748d]">
        #{rank}
      </div>

      <div className="pl-4">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Link
                href={`/applications/${applicant.id}`}
                className="font-medium text-[#061b31] hover:text-[#533afd]"
              >
                {applicant.name}
              </Link>
              <AIScoreBadge score={applicant.aiScore} />
            </div>
            <p className="text-sm text-[#64748d]">{applicant.email}</p>
          </div>
          <Badge variant={statusVariants[applicant.status]} className="shrink-0 capitalize">
            {applicant.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Highlights */}
        <div className="mt-3 flex flex-wrap gap-2">
          {applicant.highlights.map((highlight, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-md border border-[#d6d9fc] bg-[#f4f6ff] px-2 py-0.5 text-xs text-[#4434d4]"
              title={highlight}
            >
              {highlight.length > 25 ? `${highlight.slice(0, 25)}...` : highlight}
            </span>
          ))}
        </div>

        {/* Actions Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 border-[#d6d9fc] text-xs"
              onClick={() => onShortlist?.(applicant.id)}
              disabled={applicant.status === "shortlisted"}
            >
              <Star className="h-3.5 w-3.5" />
              Shortlist
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 border-[#d6d9fc] text-xs"
              onClick={() => onInterview?.(applicant.id)}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Interview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReject?.(applicant.id)}
              disabled={applicant.status === "rejected"}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#64748d]">
            <Calendar className="h-3 w-3" />
            {format(new Date(applicant.appliedAt), "MMM d, yyyy")}
          </div>
        </div>
      </div>
    </div>
  );
}
