import { ApplicationsPipelineClient } from "@/components/applications/applications-pipeline-client"
import { listApplications } from "@/features/applications/service"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ApplicationsPipelinePage({ searchParams }: Props) {
  const query = await searchParams
  const q = typeof query.q === "string" ? query.q : ""
  const status = typeof query.status === "string" ? query.status : ""
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : ""
  const roleType = typeof query.roleType === "string" ? query.roleType : ""

  const applications = await listApplications({ q, status, departmentId, roleType })

  return <ApplicationsPipelineClient applications={applications} />
}
