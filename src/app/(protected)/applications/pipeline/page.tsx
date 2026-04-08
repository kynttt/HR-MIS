import { ApplicationsPipelineClient } from "@/components/applications/applications-pipeline-client";
import { listApplications } from "@/features/applications/service";
import type { ApplicationStatus, RoleType } from "@/types/domain";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ROLE_TYPES: readonly RoleType[] = ["faculty", "staff"];
const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "for_requirements",
  "accepted",
  "rejected",
  "withdrawn"
];

function parseEnumValue<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export default async function ApplicationsPipelinePage({ searchParams }: Props) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const status = parseEnumValue(query.status, APPLICATION_STATUSES);
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : undefined;
  const roleType = parseEnumValue(query.roleType, ROLE_TYPES);

  const applications = await listApplications({ q, status, departmentId, roleType });

  return <ApplicationsPipelineClient applications={applications} />;
}
