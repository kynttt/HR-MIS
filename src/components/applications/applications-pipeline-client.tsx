"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KanbanSquare } from "lucide-react"
import { toast } from "sonner"

import { ApplicationSheet } from "@/components/applications/application-sheet"
import { PipelineBoard } from "@/components/applications/pipeline/pipeline-board"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateApplicationStatus } from "@/features/applications/actions"
import type { ApplicationListItem } from "@/features/applications/service"
import type { JobOpeningListItem } from "@/features/jobs/service"
import { useApplicationsStore } from "@/features/applications/store"

interface ApplicationsPipelineClientProps {
  applications: ApplicationListItem[]
  activeRoleOpenings: JobOpeningListItem[]
  selectedRoleOpeningId: string
}

function ApplicationsPipelineClient({ applications, activeRoleOpenings, selectedRoleOpeningId }: ApplicationsPipelineClientProps) {
  const [sheetId, setSheetId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    applications: pipelineState,
    setApplications,
    updateApplicationStatus: setStatusOptimistic
  } = useApplicationsStore()

  const pipelineApps = useMemo(
    () =>
      applications.map((app) => ({
        id: app.id,
        applicantName: app.applicant ? `${app.applicant.first_name} ${app.applicant.last_name}` : "Unknown",
        jobTitle: app.job?.job_title ?? "Unknown",
        departmentName: app.job?.department_name ?? null,
        status: app.status,
        submittedAt: app.submitted_at,
        aiScore: app.aiScore
      })),
    [applications]
  )

  useEffect(() => {
    const shouldHydrate =
      pipelineState.length === 0 ||
      pipelineState.length !== pipelineApps.length ||
      pipelineApps.some((app) => !pipelineState.some((existing) => existing.id === app.id))

    if (shouldHydrate) {
      setApplications(pipelineApps)
    }
  }, [pipelineApps, pipelineState, setApplications])

  const handleStatusChange = async (id: string, newStatus: string) => {
    const previous = [...pipelineState]

    setStatusOptimistic(id, newStatus)

    try {
      const result = await updateApplicationStatus(id, newStatus as Parameters<typeof updateApplicationStatus>[1])

      if (!result.ok) {
        throw new Error(result.error)
      }
    } catch {
      setApplications(previous)
      toast.error("Failed to update status")
    }
  }

  const handleRoleOpeningChange = (nextRoleOpeningId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (nextRoleOpeningId) {
      params.set("jobOpeningId", nextRoleOpeningId)
    } else {
      params.delete("jobOpeningId")
    }

    router.push(`/applications/pipeline${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
        <p className="code-label text-xs text-[#64748d]">Applications</p>
        <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-[#061b31]">
          <KanbanSquare className="h-6 w-6" />
          Pipeline Board
        </h2>
        <p className="mt-1 text-sm text-[#64748d]">Drag and drop cards to update application status instantly.</p>
        <div className="mt-4 max-w-xl">
          <Select name="jobOpeningId" value={selectedRoleOpeningId} onChange={(event) => handleRoleOpeningChange(event.target.value)}>
            <option value="">All active role openings</option>
            {activeRoleOpenings.map((opening) => (
              <option key={opening.id} value={opening.id}>
                {opening.job_title} - {opening.department_name ?? "No department"} ({opening.role_type})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Tabs value="pipeline" onValueChange={(v) => v === "list" && router.push("/applications")}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>
      </Tabs>

      <PipelineBoard initialApplications={pipelineApps} onQuickView={setSheetId} onStatusChange={handleStatusChange} />

      <ApplicationSheet applicationId={sheetId} onClose={() => setSheetId(null)} />
    </div>
  )
}

export { ApplicationsPipelineClient }
