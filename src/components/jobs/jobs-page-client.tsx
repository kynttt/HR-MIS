"use client";

import { useCallback, useContext, createContext, useState, type ReactNode } from "react";

import { JobApplicantsSheet } from "./job-applicants-sheet";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { getRankedApplicantsForJob } from "@/features/applications/ai-ranking-service";
import type { RankedApplicant } from "@/features/jobs/types";

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
  const [applicants, setApplicants] = useState<RankedApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewApplicants = useCallback(async (job: JobOpeningListItem) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
    setIsLoading(true);
    try {
      const data = await getRankedApplicantsForJob(job.id);
      setApplicants(data);
    } catch (error) {
      console.error("Failed to load applicants:", error);
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          applicants={applicants}
          isLoading={isLoading}
        />
      )}
    </JobsPageContext.Provider>
  );
}
