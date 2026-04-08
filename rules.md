# rules.md

## Engineering Rules

1. Validate all external input on the server.
- Use Zod `safeParse` for Server Actions, Route Handlers, and background jobs.
- Reject invalid payloads with controlled errors; do not rely on client validation.

2. Enforce authorization in every mutating API surface.
- Every privileged server action must call `requireAdminRole(...)` before doing work.
- Do not assume route protection alone is enough.

3. Add rate limiting to abuse-prone endpoints.
- Public submission and upload actions must enforce rate limits.`r`n- Production deployments must use a shared limiter backend (e.g., Upstash Redis), not process-local memory only.
- Return explicit throttling errors instead of silently dropping requests.

4. Validate uploads strictly.
- Require allowed `document_type`, max file size, and allowed MIME/extension.
- Clean up external storage if DB write fails after upload.

5. No silent failure handling.
- No empty `catch` blocks.
- Log cleanup failures with context (`console.error` at minimum) and return actionable errors when possible.

6. Preserve consistency across multi-step writes.
- Use transactions where available; otherwise add compensating rollback logic.
- Never leave partial applicant/application/employee state on failure.

7. Query only what you need.
- Avoid broad `*` selects in production paths.
- Select minimal columns and relations required by the response.

8. Handle DB errors on every write.
- Check and branch on every insert/update/delete/upsert result.
- Treat partial write failures as errors and stop the flow.

9. Keep typing strict.
- No `any` in API logic.
- Use domain enums/types for status, role, and filter parameters.

10. Definition of done for API changes.
- Input validation present.
- Auth/role checks present.
- Rate limiting present where abuse is possible.
- Failure paths tested and non-silent.
- Queries scoped to required fields only.

