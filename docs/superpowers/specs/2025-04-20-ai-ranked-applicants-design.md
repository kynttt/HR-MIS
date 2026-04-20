# AI-Ranked Applicants Slide-Over Design

**Date:** 2025-04-20  
**Feature:** AI-Ranked Applicants Panel  
**Status:** Design Approved

---

## Overview

A slide-over panel that displays applicants for a specific job opening, ranked by AI match score. Accessed from the Job Openings page via "View Applicants" button.

---

## User Flow

1. Admin navigates to `/jobs` (Job Openings page)
2. Clicks "View Applicants" button on a job row
3. Slide-over opens from right with ranked list
4. Reviews applicants sorted by AI score
5. Filters/sorts as needed
6. Takes action (view full app, shortlist, reject)
7. Closes panel to return to job list

---

## UI Specification

### Entry Point

**Location:** Job Openings table (`/jobs` page)
**Trigger:** "View Applicants" button in Action column
**Icon:** Users or Eye icon alongside text

### Slide-Over Panel

**Width:** 640px (widescreen)
**Origin:** Slides from right
**Animation:** 300ms ease-out
**Backdrop:** Semi-transparent dark overlay

**Header:**
- Job title (e.g., "Assistant Professor - Computer Science")
- Organization name
- Total applicant count badge
- Close button (X)

**Filter Bar:**
- Status Select: All | Submitted | Under Review | Shortlisted | Interviewed | Accepted | Rejected
- Search Input: "Search by name..."
- Sort Select: Highest Score | Lowest Score | Newest First | Oldest First

### Applicant Card Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Rank   Name                        Score Badge     Status Badge        │
│  #1    John Doe                    [96% MATCH]    [SHORTLISTED]      │
│                                                                     │
│  ┌─────────────────┬─────────────────┬─────────────────┐             │
│  │ Shortlist       │ Interview       │ Reject          │             │
│  └─────────────────┴─────────────────┴─────────────────┘             │
│                                                                     │
│  Highlights: PhD Computer Science • 5 yrs teaching • ML research    │
│  Applied: Mar 15, 2025                                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Card Elements:**

1. **Rank Number:** `#1`, `#2`, etc. Large, muted gray
2. **Name:** Primary text, clickable to view full application
3. **Email:** Secondary text, smaller, gray
4. **AI Score Badge:**
   - 90-100%: Emerald bg + "Excellent Match" tooltip
   - 75-89%: Blue bg + "Strong Match" tooltip
   - 60-74%: Amber bg + "Good Match" tooltip
   - <60%: Gray bg + "Review" tooltip
5. **Status Badge:** Uses existing Badge component variants
6. **Quick Actions:**
   - Shortlist: Star icon + text
   - Interview: Calendar icon + text
   - Reject: X icon + text
7. **Highlights:** 2-3 chips, horizontal scroll if needed
8. **Applied Date:** "Applied: [date]"

### Score Color Legend

| Score Range | Color | Label |
|-------------|-------|-------|
| 90-100% | Emerald 500 | Excellent Match |
| 75-89% | Blue 500 | Strong Match |
| 60-74% | Amber 500 | Good Match |
| <60% | Slate 400 | Review Needed |

---

## Data Model

### RankedApplicant Interface

```typescript
interface RankedApplicant {
  id: string;                    // Application ID
  applicantId: string;           // User profile ID
  name: string;                // Full name
  email: string;               // Email address
  aiScore: number;             // 0-100 match score
  status: ApplicationStatus;    // Current application status
  appliedAt: string;           // ISO date string
  highlights: string[];        // Top 3 matching highlights
  resumeUrl?: string;          // Optional resume link
}
```

### Mock Data (for UI development)

```typescript
const mockRankedApplicants: RankedApplicant[] = [
  {
    id: "app-001",
    applicantId: "user-101",
    name: "Dr. Sarah Chen",
    email: "s.chen@email.com",
    aiScore: 96,
    status: "shortlisted",
    appliedAt: "2025-03-15T08:30:00Z",
    highlights: [
      "PhD Computer Science",
      "8 years teaching",
      "Published 12 papers"
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
      "5 years industry",
      "Certified AWS"
    ]
  },
  {
    id: "app-003",
    applicantId: "user-103",
    name: "Emily Watson",
    email: "e.watson@email.com",
    aiScore: 72,
    status: "submitted",
    appliedAt: "2025-03-20T09:15:00Z",
    highlights: [
      "BS Computer Science",
      "2 years TA",
      "Python expert"
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
      "Research focused",
      "Teaching exp: 1 yr"
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
      "BS IT",
      "No teaching exp",
      "Industry only"
    ]
  }
];
```

---

## Component Breakdown

### New Components

1. **`JobApplicantsSheet`** - Main slide-over container
   - Props: `jobId`, `isOpen`, `onClose`, `jobTitle`, `orgName`
   - State: `applicants`, `sortBy`, `statusFilter`, `searchQuery`

2. **`RankedApplicantCard`** - Individual applicant row
   - Props: `applicant`, `rank`, `onView`, `onShortlist`, `onInterview`, `onReject`

3. **`AIScoreBadge`** - Score display with color coding
   - Props: `score`

### Existing Components to Reuse

- `Sheet` - From shadcn/ui for slide-over
- `Badge` - For status badges
- `Button` - For quick actions
- `Input` - For search
- `Select` - For filters/sort
- `Skeleton` - For loading state

---

## File Structure

```
src/
├── app/
│   └── (protected)/
│       └── jobs/
│           └── page.tsx              # Add "View Applicants" button
├── components/
│   ├── jobs/
│   │   └── job-applicants-sheet.tsx  # Main slide-over
│   └── applicants/
│       ├── ranked-applicant-card.tsx
│       └── ai-score-badge.tsx
└── features/
    └── jobs/
        └── types.ts                  # Add RankedApplicant type
```

---

## UX States

### Loading State
- Skeleton cards (3-5 rows)
- Shimmer effect on score badges

### Empty State
- Icon: Inbox or Search
- Text: "No applicants found"
- Subtext: "Try adjusting filters"

### Single Applicant
- Full card layout, rank #1

### Many Applicants
- Virtual scroll or pagination (max 50 visible)
- "Load more" button if >50

---

## Accessibility

- Focus trap within slide-over
- ESC key closes panel
- ARIA: `dialog`, `aria-labelledby`
- Action buttons have descriptive labels
- Color alone doesn't convey meaning (text + color)

---

## Future Enhancements (Out of Scope)

- Real AI scoring integration
- Bulk actions (select multiple, reject all)
- Export to CSV
- Compare applicants side-by-side
- AI-generated summary paragraph

---

## Acceptance Criteria

- [ ] "View Applicants" button appears on Job Openings table rows
- [ ] Clicking opens 640px slide-over from right
- [ ] Panel shows job title + applicant count in header
- [ ] List displays 5+ mock applicants with realistic data
- [ ] Each applicant shows: rank, name, email, AI score (color-coded), status, highlights, applied date
- [ ] Quick action buttons display (functional or visually present)
- [ ] Filters work: status filter, search by name
- [ ] Sort options work: score (high/low), date (new/old)
- [ ] Close button works, returns to job list
- [ ] Responsive: works on desktop (640px), tablet (full width), mobile (full width)
- [ ] Loading skeleton displays while "fetching"
- [ ] Empty state displays if no matches after filter

---

**Approved by:** User  
**Next Step:** Implementation Plan
