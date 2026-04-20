import type { RankedApplicant } from "./types";

export const mockRankedApplicants: RankedApplicant[] = [
  {
    id: "app-001",
    applicantId: "user-101",
    name: "Dr. Sarah Chen",
    email: "s.chen@university.edu",
    aiScore: 96,
    status: "shortlisted",
    appliedAt: "2025-03-15T08:30:00Z",
    highlights: [
      "PhD Computer Science - Stanford",
      "8 years teaching experience",
      "Published 12 research papers"
    ]
  },
  {
    id: "app-002",
    applicantId: "user-102",
    name: "Michael Rodriguez",
    email: "m.rodriguez@email.com",
    aiScore: 88,
    status: "under_review",
    appliedAt: "2025-03-18T14:22:00Z",
    highlights: [
      "MS Software Engineering",
      "5 years industry experience",
      "Certified AWS Solutions Architect"
    ]
  },
  {
    id: "app-003",
    applicantId: "user-103",
    name: "Emily Watson",
    email: "e.watson@university.edu",
    aiScore: 72,
    status: "submitted",
    appliedAt: "2025-03-20T09:15:00Z",
    highlights: [
      "BS Computer Science",
      "2 years as Teaching Assistant",
      "Python expert with ML focus"
    ]
  },
  {
    id: "app-004",
    applicantId: "user-104",
    name: "James Park",
    email: "j.park@email.com",
    aiScore: 65,
    status: "submitted",
    appliedAt: "2025-03-21T11:45:00Z",
    highlights: [
      "MS Data Science",
      "Research focused background",
      "1 year teaching experience"
    ]
  },
  {
    id: "app-005",
    applicantId: "user-105",
    name: "Lisa Thompson",
    email: "l.thompson@email.com",
    aiScore: 45,
    status: "rejected",
    appliedAt: "2025-03-19T16:00:00Z",
    highlights: [
      "BS Information Technology",
      "No teaching experience",
      "Industry only background"
    ]
  },
  {
    id: "app-006",
    applicantId: "user-106",
    name: "David Kim",
    email: "d.kim@university.edu",
    aiScore: 91,
    status: "interview_scheduled",
    appliedAt: "2025-03-17T10:30:00Z",
    highlights: [
      "PhD Artificial Intelligence",
      "6 years teaching experience",
      "Published 8 papers on ML"
    ]
  }
];
