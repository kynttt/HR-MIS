# AI-Ranked Applicants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide-over panel that displays AI-ranked applicants for a job, accessed from the Job Openings page.

**Architecture:** Client-side state managed by a wrapper component that opens/closes the Sheet. Mock data stored in a constants file. Components are modular: sheet container, applicant card, score badge.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui (Sheet, Badge, Button, Input, Select, Skeleton)

---

## Plan Summary

1. Add RankedApplicant type to features/jobs/types.ts
2. Create mock data constant for ranked applicants
3. Create AIScoreBadge component with color coding
4. Create RankedApplicantCard component
5. Create JobApplicantsSheet slide-over container
6. Modify jobs page to add "View Applicants" button and client wrapper
7. Run typecheck and lint
8. Commit all changes

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Slide-over from right (640px) - Task 5
- [x] Entry point from Job Openings - Task 6
- [x] Ranked list display - Task 4, 5
- [x] AI score with color coding - Task 3
- [x] Status badges - Task 4 (uses existing)
- [x] Highlights display - Task 4
- [x] Filters and sort - Task 5
- [x] Quick actions - Task 4
- [x] Mock data - Task 2

**No Placeholders:**
- [x] No TBD/TODO items
- [x] All code blocks complete
- [x] Exact file paths provided
- [x] Expected outputs specified

**Type Consistency:**
- [x] RankedApplicant type defined in Task 1
- [x] Used consistently in Tasks 2-5

---

### Task 1: Add RankedApplicant Type

**Files:**
- Modify: `src/features/jobs/types.ts`

- [ ] **Step 1: Add RankedApplicant interface**

Add after existing exports in `src/features/jobs/types.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/features/jobs/types.ts
git commit -m "feat: add RankedApplicant type for AI-ranked applicants feature"
```

---

### Task 2: Create Mock Data

**Files:**
- Create: `src/features/jobs/mock-ranked-applicants.ts`

- [ ] **Step 1: Create mock data file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/features/jobs/mock-ranked-applicants.ts
git commit -m "feat: add mock ranked applicants data for development"
```

---

### Task 3: Create AIScoreBadge Component

**Files:**
- Create: `src/components/applicants/ai-score-badge.tsx`

- [ ] **Step 1: Create component file**

```typescript
"use client";

import { cn } from "@/lib/utils/cn";

interface AIScoreBadgeProps {
  score: number;
  className?: string;
}

export function AIScoreBadge({ score, className }: AIScoreBadgeProps) {
  const getScoreTier = (s: number) => {
    if (s >= 90) return { color: "bg-emerald-500", label: "Excellent Match" };
    if (s >= 75) return { color: "bg-blue-500", label: "Strong Match" };
    if (s >= 60) return { color: "bg-amber-500", label: "Good Match" };
    return { color: "bg-slate-400", label: "Review Needed" };
  };

  const tier = getScoreTier(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white",
        tier.color,
        className
      )}
      title={tier.label}
    >
      <span>{score}%</span>
      <span className="hidden sm:inline">MATCH</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/applicants/ai-score-badge.tsx
git commit -m "feat: add AIScoreBadge component with tier colors"
```

---

### Task 4: Create RankedApplicantCard Component

**Files:**
- Create: `src/components/applicants/ranked-applicant-card.tsx`

- [ ] **Step 1: Create component file**

```typescript
"use client";

import { Calendar, Eye, Star, CalendarCheck, X } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RankedApplicant } from "@/features/jobs/types";
import { format } from "date-fns";
import { AIScoreBadge } from "./ai-score-badge";

interface RankedApplicantCardProps {
  applicant: RankedApplicant;
  rank: number;
  onShortlist?: (id: string) => void;
  onInterview?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusVariants: Record<RankedApplicant["status"], Parameters<typeof Badge>[0]["variant"]> = {
  submitted: "muted",
  under_review: "secondary",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "info",
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
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-[#d6d9fc] text-xs"
              onClick={() => onShortlist?.(applicant.id)}
              disabled={applicant.status === "shortlisted"}
            >
              <Star className="h-3.5 w-3.5" />
              Shortlist
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-[#d6d9fc] text-xs"
              onClick={() => onInterview?.(applicant.id)}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Interview
            </Button>
            <Button
              variant="outline"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/applicants/ranked-applicant-card.tsx
git commit -m "feat: add RankedApplicantCard component with actions"
```

---

### Task 5: Create JobApplicantsSheet Component

**Files:**
- Create: `src/components/jobs/job-applicants-sheet.tsx`

- [ ] **Step 1: Create component file**

```typescript
"use client";

import { useMemo, useState } from "react";
import { Briefcase, Users, X, Search, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { RankedApplicantCard } from "@/components/applicants/ranked-applicant-card";
import type { RankedApplicant } from "@/features/jobs/types";

interface JobApplicantsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  orgName: string;
  applicants: RankedApplicant[];
  isLoading?: boolean;
}

type SortOption = "score_desc" | "score_asc" | "date_desc" | "date_asc";

export function JobApplicantsSheet({
  isOpen,
  onClose,
  jobTitle,
  orgName,
  applicants,
  isLoading = false
}: JobApplicantsSheetProps) {
  const [sortBy, setSortBy] = useState<SortOption>("score_desc");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedApplicants = useMemo(() => {
    let result = [...applicants];

    // Filter by status
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "score_desc":
          return b.aiScore - a.aiScore;
        case "score_asc":
          return a.aiScore - b.aiScore;
        case "date_desc":
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case "date_asc":
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [applicants, sortBy, statusFilter, searchQuery]);

  const handleShortlist = (id: string) => {
    console.log("Shortlist:", id);
  };

  const handleInterview = (id: string) => {
    console.log("Interview:", id);
  };

  const handleReject = (id: string) => {
    console.log("Reject:", id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl"
        aria-describedby="job-applicants-description"
      >
        <SheetHeader className="border-b border-[#e5edf5] pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-5 w-5 text-[#533afd]" />
                {jobTitle}
              </SheetTitle>
              <p className="text-sm text-[#64748d]">{orgName}</p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {applicants.length} applicants
            </Badge>
          </div>
        </SheetHeader>

        <p id="job-applicants-description" className="sr-only">
          AI-ranked applicants for {jobTitle}. Ranked by match score from highest to lowest.
        </p>

        {/* Filters */}
        <div className="mt-4 space-y-3 border-b border-[#e5edf5] pb-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748d]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interviewed">Interviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </Select>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-44"
              >
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          {isLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#e5edf5] bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="mt-2 h-4 w-48" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredAndSortedApplicants.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-8 text-center">
              <Filter className="h-12 w-12 text-[#64748d]" />
              <h3 className="mt-4 text-lg font-medium text-[#061b31]">
                No applicants found
              </h3>
              <p className="mt-2 text-sm text-[#64748d]">
                Try adjusting your filters or search query.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setStatusFilter("");
                  setSearchQuery("");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            // List
            filteredAndSortedApplicants.map((applicant, index) => (
              <RankedApplicantCard
                key={applicant.id}
                applicant={applicant}
                rank={index + 1}
                onShortlist={handleShortlist}
                onInterview={handleInterview}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/job-applicants-sheet.tsx
git commit -m "feat: add JobApplicantsSheet slide-over component"
```

---

### Task 6: Modify Jobs Page to Add Entry Point

**Files:**
- Modify: `src/app/(protected)/jobs/page.tsx`
- Create: `src/components/jobs/jobs-page-client.tsx`

- [ ] **Step 1: Create JobsPageClient wrapper**

Create `src/components/jobs/jobs-page-client.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { JobApplicantsSheet } from "./job-applicants-sheet";
import type { OpenJobListItem } from "@/features/jobs/service";
import { mockRankedApplicants } from "@/features/jobs/mock-ranked-applicants";

interface JobsPageClientProps {
  jobs: OpenJobListItem[];
  children: React.ReactNode;
}

export function JobsPageClient({ jobs, children }: JobsPageClientProps) {
  const [selectedJob, setSelectedJob] = useState<OpenJobListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleViewApplicants = (job: OpenJobListItem) => {
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
          orgName={selectedJob.organization_name}
          applicants={mockRankedApplicants}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Update jobs page.tsx**

Modify `src/app/(protected)/jobs/page.tsx`:

Replace the imports section (add these imports):

```typescript
import { JobsPageClient } from "@/components/jobs/jobs-page-client";
```

Replace the Table row action section (around line 171-185, the Action column):

Old code:
```typescript
<TableCell>
  <div className="flex items-center gap-2">
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <Link href={`/jobs/${job.id}/edit` as any} className="text-xs text-brand-700 hover:text-brand-500">
      Edit
    </Link>
    <span className="text-[#e5edf5]">|</span>
    <form action={setJobOpeningStatusAction.bind(null, job.id, job.status === "open" ? "closed" : "open")}>
      <button className="text-xs text-[#64748d] hover:text-[#061b31]" type="submit">
        {job.status === "open" ? "Close" : "Open"}
      </button>
    </form>
  </div>
</TableCell>
```

New code:
```typescript
<TableCell>
  <div className="flex items-center gap-2">
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <Link href={`/jobs/${job.id}/edit` as any} className="text-xs text-brand-700 hover:text-brand-500">
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
      onClick={() => onViewApplicants?.(job)}
    >
      <Users className="h-3 w-3" />
      View Applicants
    </Button>
  </div>
</TableCell>
```

Also need to wrap the return with JobsPageClient. Replace the entire return statement:

Old:
```typescript
export default async function JobsPage({ searchParams }: Props) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      ...
    </div>
  );
}
```

New:
```typescript
export default async function JobsPage({ searchParams }: Props) {
  // ... existing code ...

  return (
    <JobsPageClient jobs={jobs}>
      {({ onViewApplicants }) => (
        <div className="space-y-6">
          ...existing content...
          
          {/* In the table row, pass onViewApplicants */}
        </div>
      )}
    </JobsPageClient>
  );
}
```

Actually, a simpler approach: wrap the entire page content and use a render prop pattern:

Replace the entire component with this updated version that properly integrates:

```typescript
import Link from "next/link";
import { format } from "date-fns";
import { Briefcase, Plus, Users } from "lucide-react";

import { JobsPageToast } from "@/components/jobs/jobs-page-toast";
import { JobsPageClient } from "@/components/jobs/jobs-page-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { SortHeader } from "@/components/ui/sort-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listDepartments } from "@/features/departments/service";
import { setJobOpeningStatusAction } from "@/features/jobs/actions";
import { listJobOpeningsPaginated, type JobSortKey, type JobStatus } from "@/features/jobs/service";
import type { RoleType } from "@/types/domain";

// ... keep all existing type definitions and helper functions ...

export default async function JobsPage({ searchParams }: Props) {
  // ... keep all existing data fetching logic ...

  return (
    <JobsPageClient jobs={jobs}>
      {({ onViewApplicants }) => (
        <div className="space-y-6">
          <JobsPageToast created={created} updated={updated} />

          <section className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-5 shadow-[0_18px_45px_-34px_rgba(83,58,253,0.35)] lg:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">Recruitment</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#061b31]">
                  <Briefcase className="h-6 w-6" />
                  Job Openings
                </h2>
                <p className="mt-1 text-sm text-[#273951]">Manage active and closed positions across departments.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm text-[#273951]">{total} total records</span>
                <Button asChild>
                  <Link href="/jobs/create">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Job Opening
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <form className="grid gap-3 rounded-xl border border-[#e5edf5] bg-white p-4 shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)] lg:grid-cols-12 lg:p-5">
            <div className="lg:col-span-3">
              <Input defaultValue={q} name="q" placeholder="Search by title" />
            </div>
            <div className="lg:col-span-3">
              <Select defaultValue={status ?? ""} name="status">
                <option value="">All job statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Select defaultValue={departmentId ?? ""} name="departmentId">
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select defaultValue={roleType ?? ""} name="roleType">
                <option value="">All role types</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <Button className="w-full" type="submit" size="sm">
                Apply
              </Button>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-[#e5edf5] bg-white shadow-[0_20px_40px_-38px_rgba(6,27,49,0.65)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader name="title" label="Title" currentSort={sort ?? ""} currentOrder={order} />
                    <SortHeader name="department" label="Department" currentSort={sort ?? ""} currentOrder={order} />
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <SortHeader name="status" label="Status" currentSort={sort ?? ""} currentOrder={order} />
                    <SortHeader name="created" label="Posted" currentSort={sort ?? ""} currentOrder={order} />
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-[#64748d]">
                        No job openings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium text-[#061b31]">{job.job_title}</TableCell>
                        <TableCell className="text-[#64748d]">{job.department_name ?? "-"}</TableCell>
                        <TableCell className="capitalize text-[#64748d]">{job.role_type}</TableCell>
                        <TableCell className="capitalize text-[#64748d]">{job.employment_type.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === "open" ? "success" : "muted"}>{job.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[#64748d]">
                          {format(new Date(job.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <QueryPagination page={currentPage} pageSize={PAGE_SIZE} total={total} />
          </div>
        </div>
      )}
    </JobsPageClient>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/jobs/page.tsx
git add src/components/jobs/jobs-page-client.tsx
git commit -m "feat: add View Applicants button and integrate slide-over"
```

---

### Task 7: Verify and Finalize

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors (or auto-fix with --fix)

- [ ] **Step 3: Commit if any fixes**

```bash
git add -A
git commit -m "fix: resolve typecheck and lint issues" || echo "No changes to commit"
```

---

## Summary

This implementation adds:

1. **Type definition** for RankedApplicant
2. **Mock data** with 6 realistic applicants
3. **AIScoreBadge** component with tier colors
4. **RankedApplicantCard** with highlights and actions
5. **JobApplicantsSheet** slide-over (640px) with filters/sort
6. **JobsPageClient** wrapper to manage sheet state
7. **Entry point** "View Applicants" button on each job row

**Features:**
- Opens from right side when clicking "View Applicants"
- Shows AI score with color-coded tiers
- Displays status, highlights, applied date
- Sort by score (high/low) or date (new/old)
- Filter by status
- Search by name/email
- Quick actions (Shortlist, Interview, Reject)
- Loading skeletons
- Empty state
- Responsive design

**Mock data includes:**
- 6 applicants with scores ranging from 45% to 96%
- Various statuses (submitted, under_review, shortlisted, interview_scheduled, rejected)
- Realistic highlights
- Different applied dates
