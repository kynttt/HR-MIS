export interface RankedApplicant {
  id: string;
  applicantId: string;
  name: string;
  email: string;
  aiScore: number;
  status: "submitted" | "under_review" | "shortlisted" | "interview_scheduled" | "interviewed" | "for_requirements" | "accepted" | "rejected" | "withdrawn";
  appliedAt: string;
  highlights: string[];
  resumeUrl?: string;
}
