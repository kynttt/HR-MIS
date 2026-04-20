"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { JobApplicantsSheet } from "./job-applicants-sheet";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { mockRankedApplicants } from "@/features/jobs/mock-ranked-applicants";

interface JobsPageContextType {
  onViewApplicants: (job: JobOpeningListItem) => void;
}

const JobsPageContext = createContext<JobsPageContextType | null>(null);

export function useJobsPage() {
  const context = useContext(JobsPageContext);
  if (!context) {
    throw new Error("useJobsPage must be used within JobsPageClient");
  }
  return context;
}

interface JobsPageClientProps {
  jobs: JobOpeningListItem[];
  children: ReactNode;
}

export function JobsPageClient({ jobs, children }: JobsPageClientProps) {
  const [selectedJob, setSelectedJob] = useState<JobOpeningListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleViewApplicants = (job: JobOpeningListItem) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  return (
    <JobsPageContext.Provider value={{ onViewApplicants: handleViewApplicants }}>
      {children}
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
    </JobsPageContext.Provider>
  );
}
