# AI Applicant Ranking Skill — Design Spec

> **Goal:** Build the first AI skill that evaluates applicant resumes against job descriptions and assigns a 0–100 match score. The skill is orchestrated automatically on application submission and can be triggered manually by admins.

---

## Architecture

A self-contained skill module under `src/skills/ai-applicant-ranking/`. It is the first skill in a future skills registry. The skill is orchestrated by:

1. **Automatic** — `submitApplicationAction` fires-and-forgets `rankSingleApplication()` after insertion, if AI is enabled.
2. **Manual** — Admins click **"Rank Applicants"** on a job row; the UI calls `rankAllApplicationsForJob()`.

The skill encapsulates:
- Resume text extraction (PDF/DOCX)
- Prompt construction
- Provider-agnostic AI completion calling
- Structured JSON response parsing
- Score persistence into `application_ai_scores`

---

## Data Model

### New Table: `public.application_ai_scores`

```sql
create table public.application_ai_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  job_opening_id uuid not null references public.job_openings(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,

  score numeric(5,2) not null check (score >= 0 and score <= 100),
  highlights text[] not null default '{}',
  rationale text,

  model text not null,
  provider text not null,
  tokens_used integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (application_id)
);

create trigger set_updated_at_application_ai_scores
  before update on public.application_ai_scores
  for each row execute function public.set_updated_at();

alter table public.application_ai_scores enable row level security;

create policy "admin_manage_ai_scores"
  on public.application_ai_scores
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());
```

### Index
```sql
create index idx_ai_scores_job on public.application_ai_scores(job_opening_id);
create index idx_ai_scores_org on public.application_ai_scores(organization_id);
```

---

## Skill Module

### `src/skills/ai-applicant-ranking/types.ts`
```typescript
export interface RankResult {
  applicationId: string;
  score: number;
  highlights: string[];
  rationale: string;
  provider: string;
  model: string;
}

export interface RankOptions {
  forceRecompute?: boolean;
}
```

### `src/skills/ai-applicant-ranking/extractor.ts`
Responsible for downloading a Cloudinary file and extracting text.

```typescript
export async function extractResumeText(fileUrl: string): Promise<string | null>
```
- Downloads the file via `fetch()`.
- Detects file type from `Content-Type` or URL extension.
- PDF → `pdf-parse` (new dependency)
- DOCX → `mammoth` (new dependency)
- Other → returns `null`.

### `src/skills/ai-applicant-ranking/prompts.ts`
```typescript
export function buildRankingPrompt(params: {
  jobTitle: string;
  jobDescription: string | null;
  jobQualifications: string | null;
  resumeText: string;
}): string
```

The prompt must be strict about output format. Example:
```
You are an expert HR evaluator. Given a job opening and an applicant's resume, evaluate the match.

Job Title: {jobTitle}
Job Description: {jobDescription}
Required Qualifications: {jobQualifications}

Resume:
{resumeText}

Respond ONLY with valid JSON in this exact shape:
{
  "score": number from 0 to 100,
  "highlights": ["string", "string"],
  "rationale": "string"
}

Rules:
- score: 90-100 = excellent match, 75-89 = strong, 60-74 = good, below 60 = review needed
- highlights: array of specific observations (strengths or weaknesses), max 5 items
- rationale: one concise sentence summarizing the fit
```

### `src/skills/ai-applicant-ranking/orchestrator.ts`
```typescript
export async function rankSingleApplication(
  applicationId: string,
  options?: RankOptions
): Promise<RankResult | null>

export async function rankAllApplicationsForJob(
  jobOpeningId: string
): Promise<RankResult[]>
```

**`rankSingleApplication` flow:**
1. Load AI config via `getAIConfiguration()`. Return `null` if disabled.
2. Load application + applicant + job opening + resume document from Supabase.
3. If a score exists and `!forceRecompute`, return cached score.
4. Download resume via `extractResumeText()`. If null, return error result (`score: 0`, `rationale: "Could not read resume"`).
5. Build prompt via `buildRankingPrompt()`.
6. Call configured AI provider:
   - OpenAI: `https://api.openai.com/v1/chat/completions` (non-streaming)
   - Gemini: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
   - Ollama: `{baseUrl}/api/generate`
7. Parse JSON from response. If invalid, retry once with `"Return strictly valid JSON."` appended. If still invalid, return error result.
8. Validate shape with Zod schema.
9. Upsert into `application_ai_scores`.
10. Return `RankResult`.

**`rankAllApplicationsForJob` flow:**
1. Load all applications for the job with status in `submitted, under_review`.
2. Filter to those with resume documents.
3. Call `rankSingleApplication()` for each, sequentially (to avoid rate limits).
4. Return array of results.

---

## API Route (Manual Trigger)

### `src/app/api/applications/[id]/rank/route.ts`
```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await rankSingleApplication(params.id, { forceRecompute: true });
  return NextResponse.json(result);
}
```

---

## UI Integration

### Job Row Actions
Add a **"Rank Applicants"** action to `src/components/jobs/job-row-actions.tsx` dropdown. This calls `POST /api/applications/{jobId}/rank` for every applicant of that job, with a progress toast.

### Pipeline Board
`src/components/applications/pipeline/pipeline-card.tsx` already shows `aiScore`. Update the query to join `application_ai_scores`.

### Application Detail Page
Add an **AI Evaluation** section to `src/app/(protected)/applications/[id]/page.tsx` showing:
- Score badge
- Rationale text
- Highlights list

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| AI disabled | Skip silently, return `null` |
| Resume can't be downloaded | `score: 0`, `rationale: "Could not read resume"` |
| AI returns invalid JSON | Retry once. Still invalid → `score: 0`, `rationale: "AI evaluation failed"` |
| API key invalid / quota exceeded | `score: 0`, `rationale: "AI service unavailable"` |
| Missing job description | Still evaluate using job title + qualifications |

---

## Multi-tenancy

- `application_ai_scores.organization_id` enforces row-level isolation.
- `getCurrentUserOrganizationId()` is used in every query.
- AI config is per-organization via `ai_configurations`.

---

## Dependencies

```bash
npm install pdf-parse mammoth
npm install --save-dev @types/pdf-parse
```

---

## Performance

- Resume extraction runs once per application and is cached by `application_id`.
- Text extraction for a 5-page PDF is < 500ms.
- AI completion is < 5s for GPT-4o-mini, < 15s for Gemini Flash.
- The manual `rankAll` endpoint processes applications sequentially to respect rate limits.
- Future optimization: process in batches with `Promise.all()` if provider rate limits allow.

---

## Migration

File: `supabase/migrations/010_application_ai_scores.sql`

Contains the `application_ai_scores` table, trigger, RLS policy, and indexes.
