# UI Design Implementation Plan — University HRMIS

## Context
The University HRMIS has a dark-themed shadcn-style component foundation (`src/components/ui/`) with `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`. The design tokens are hardcoded hex values (no CSS variables). Raw HTML tables and unstyled form elements dominate pages. Missing: bento dashboard, pipeline view, data tables, slide-over detail, polished apply form.

## Goals
Implement 5 UI features across the HRMIS:
1. **Dashboard metrics cards** — bento grid with icons, trends, charts
2. **Application pipeline view** — Kanban-style board with drag-and-drop
3. **Data tables with filters** — reusable DataTable + Table components, sortable columns, pagination
4. **Application detail slide-over** — panel sliding in from right for quick review
5. **Polished /apply page** — multi-step wizard with validation, file upload zone

## Architecture

### Step 1: Foundation UI Components (New Files)
Create missing shadcn-style primitives that all 5 features depend on:

- `src/components/ui/table.tsx` — `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`, `TableCaption`
- `src/components/ui/skeleton.tsx` — Loading skeleton for cards and table rows
- `src/components/ui/avatar.tsx` — User/ applicant avatars
- `src/components/ui/badge.tsx` variants expansion — add `outline` and `warning` variants
- `src/components/ui/dropdown-menu.tsx` — Dropdown with Radix UI
- `src/components/ui/dialog.tsx` — Modal dialog (dependency for slide-over)
- `src/components/ui/sheet.tsx` — Slide-over panel (right-side drawer using Sheet from Radix)
- `src/components/ui/separator.tsx` — Divider
- `src/components/ui/tooltip.tsx` — Tooltip
- `src/components/ui/tabs.tsx` — Tabs for pipeline/list toggle
- `src/components/ui/progress.tsx` — Progress bar for metrics
- `src/components/ui/pagination.tsx` — Pagination controls
- `src/components/ui/label.tsx` — Form label wrapper
- `src/components/ui/form-field.tsx` — Reusable form field (label + input + error)
- `src/components/ui/empty-state.tsx` — Empty state placeholder
- `src/components/ui/section-card.tsx` — Card section wrapper for dashboard bento

### Step 2: Dashboard Bento Grid
Update `src/app/(protected)/dashboard/page.tsx`:
- Replace uniform card grid with bento layout (2 large cards + 3 small cards using CSS Grid `grid-cols-4 grid-rows-3` with `col-span-2` and `row-span-2` on large cards)
- Create `src/components/dashboard/metric-card.tsx` with icon slot, value, label, optional trend arrow
- Create `src/components/dashboard/recent-activity.tsx` — list of recent applications/employees
- Add `src/components/dashboard/applications-chart.tsx` — simple bar chart showing applications by status (CSS-based, no chart library)
- Add `src/components/dashboard/department-chart.tsx` — donut-style chart with CSS conic-gradient
- Add skeleton loading states for all metric cards
- Update `globals.css` with CSS variables for theme tokens (progressive migration)

### Step 3: Application Pipeline View
Create `src/components/applications/pipeline/`:
- `pipeline-board.tsx` — Kanban board with columns per status (New, Screening, Interview, Offer, Hired, Rejected)
- `pipeline-column.tsx` — Single status column with drag-and-drop (use `@dnd-kit/core` + `@dnd-kit/sortable`)
- `pipeline-card.tsx` — Compact applicant card in column (avatar, name, job title, days in stage)
- Update `src/app/(protected)/applications/page.tsx` to add `Tabs` (List / Pipeline) above the content
- Pipeline cards show truncated info; clicking opens the slide-over detail

### Step 4: Data Tables with Filters
Create `src/components/ui/data-table.tsx`:
- Wrapper component accepting: columns definition, data, filters config, pagination config
- `useDataTable` hook: manages sort, filter, pagination state
- Create reusable `src/components/ui/filter-bar.tsx` with filter inputs + clear button
- Update `/applications` page to use `DataTable` with columns: checkbox, applicant, email, job, department, status (Badge), applied date, actions (dropdown menu)
- Update `/jobs` page similarly with: title, department, role type, employment type, status badge, actions
- Update `/employees` page similarly with: name, department, role type, employment status, active toggle, actions
- Add pagination to all three pages using `pagination.tsx`

### Step 5: Application Detail Slide-over
- Create `src/components/applications/application-sheet.tsx` — Sheet component with full application detail (reuses existing form components: status, notes, documents)
- Add "Quick View" button to each row in the pipeline card and DataTable
- Sheet slides in from right, 480px wide, with backdrop blur
- Tabs inside sheet: Overview | Documents | Notes | History

### Step 6: Polished /apply Page
Update `src/app/(public)/apply/page.tsx`:
- Create `src/components/applications/multi-step-form.tsx` — 3-step wizard: (1) Personal Info, (2) Documents, (3) Review & Submit
- Step indicator at top showing progress
- Each step wrapped in `Card` with section title
- Use `Input`, `Select`, `Textarea` components with `Label` and inline error messages
- File upload drag-and-drop zone using `src/components/ui/file-upload.tsx` (custom component with dashed border, icon, and drag state)
- On submit: show success card with confirmation number, error handling with toast
- Add `src/hooks/use-toast.ts` + `src/components/ui/toast.tsx` for notifications
- Responsive: single column on mobile, 2-column grid for fields on desktop

## Critical Files to Modify
- `src/app/globals.css` — Add CSS variables for theme colors
- `src/app/(protected)/dashboard/page.tsx` — New bento layout
- `src/app/(protected)/applications/page.tsx` — DataTable + Tabs
- `src/app/(protected)/jobs/page.tsx` — DataTable
- `src/app/(protected)/employees/page.tsx` — DataTable
- `src/app/(public)/apply/page.tsx` — Multi-step wizard

## New Files to Create
See Steps 1–6 above. Estimated ~30 new files.

## Verification
After implementing each step:
1. `npm run typecheck` passes
2. `npm run lint` passes
3. Dev server renders pages without console errors
4. Manual test: dashboard loads with metrics, pipeline drag works, table sorting/filtering works, slide-over opens/closes, apply form submits

## Dependencies to Install
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install sonner  # for toast notifications
```
