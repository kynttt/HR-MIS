"use client";

import { useState } from "react";

import { JobApplicantsSheet } from "./job-applicants-sheet";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { mockRankedApplicants } from "@/features/jobs/mock-ranked-applicants";

interface JobsPageClientProps {
  jobs: JobOpeningListItem[];
  children: (props: { onViewApplicants: (job: JobOpeningListItem) => void }) => React.ReactNode;
}

export function JobsPageClient({ jobs, children }: JobsPageClientProps) {
  const [selectedJob, setSelectedJob] = useState<JobOpeningListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleViewApplicants = (job: JobOpeningListItem) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  return (
    <>
      {children({ onViewApplicants: handleViewApplicants })}
      {selectedJob && (
        <JobApplicantsSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.job_title}
          orgName="University"
          applicants={mockRankedApplicants}
        />
      )}
    </>
  );
}
