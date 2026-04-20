import { notFound } from "next/navigation";
import { z } from "zod";

import { JobApplyClient } from "./apply-client";
import { listAppliedJobIdsForUser } from "@/features/applications/public-service";
import { getCurrentUser } from "@/features/auth/service";
import { getPublicJobOpeningDetails, listOpenJobOpenings } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const orgSlugSchema = z.string().trim().toLowerCase().min(1).max(64).regex(/^[a-z0-9-]+$/);
const roleTypeSchema = z.enum(["faculty", "staff"]);
const employmentTypeSchema = z.enum(["full_time", "part_time", "contractual", "job_order"]);
const jobIdSchema = z.string().uuid();

function readSingleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseSearchText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = z.string().trim().min(1).max(100).safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export default async function PublicApplyPage({ searchParams }: Props) {
  const query = await searchParams;

  const rawOrg = query.org;
  if (rawOrg !== undefined && typeof rawOrg !== "string") {
    notFound();
  }

  let organization: Awaited<ReturnType<typeof resolvePublicOrganization>> | null = null;
  if (typeof rawOrg === "string") {
    const parsedOrg = orgSlugSchema.safeParse(rawOrg);
    if (!parsedOrg.success) {
      notFound();
    }

    try {
      organization = await resolvePublicOrganization(parsedOrg.data);
    } catch {
      notFound();
    }
  }

  const q = parseSearchText(readSingleValue(query.q));

  const rawRoleType = readSingleValue(query.roleType);
  const parsedRoleType = roleTypeSchema.safeParse(rawRoleType);
  const roleType = parsedRoleType.success ? parsedRoleType.data : undefined;

  const rawEmploymentType = readSingleValue(query.employmentType);
  const parsedEmploymentType = employmentTypeSchema.safeParse(rawEmploymentType);
  const employmentType = parsedEmploymentType.success ? parsedEmploymentType.data : undefined;

  const rawJobId = readSingleValue(query.job);
  const parsedJobId = jobIdSchema.safeParse(rawJobId);
  const requestedJobId = parsedJobId.success ? parsedJobId.data : undefined;

  const jobs = await listOpenJobOpenings({
    organizationId: organization?.id,
    q,
    roleType,
    employmentType
  });

  const user = await getCurrentUser();
  const userAppliedJobIds = user
    ? await listAppliedJobIdsForUser({
        userId: user.id,
        organizationId: organization?.id,
        jobIds: jobs.map((job) => job.id)
      })
    : new Set<string>();

  const selectedJobSummary = jobs.find((job) => job.id === requestedJobId) ?? jobs[0] ?? null;

  let selectedJobDetails: Awaited<ReturnType<typeof getPublicJobOpeningDetails>> | null = null;
  if (selectedJobSummary) {
    try {
      selectedJobDetails = await getPublicJobOpeningDetails(selectedJobSummary.id);
    } catch {
      selectedJobDetails = null;
    }
  }

  return (
    <JobApplyClient
      organization={organization}
      jobs={jobs}
      initialSelectedJob={selectedJobSummary}
      initialJobDetails={selectedJobDetails}
      userAppliedJobIds={userAppliedJobIds}
      user={user ? { email: user.email ?? null } : null}
    />
  );
}
