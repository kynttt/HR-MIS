"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ApplicationSheet } from "@/components/applications/application-sheet"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ApplicationListItem } from "@/features/applications/service"

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
  submitted: "default",
  under_review: "default",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "warning",
  for_requirements: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "muted"
}

interface ApplicationsClientProps {
  applications: ApplicationListItem[]
}

function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const [activeTab, setActiveTab] = useState<"list" | "pipeline">("list")
  const [sheetId, setSheetId] = useState<string | null>(null)
  const router = useRouter()

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v === "pipeline") {
            router.push("/applications/pipeline")
            return
          }

          setActiveTab("list")
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          <div className="overflow-x-auto rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-[#64748d]">
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium text-[#061b31]">
                        {application.applicant
                          ? `${application.applicant.first_name} ${application.applicant.last_name}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-[#64748d]">{application.applicant?.email ?? "-"}</TableCell>
                      <TableCell className="text-[#64748d]">{application.job?.job_title ?? "-"}</TableCell>
                      <TableCell className="text-[#64748d]">{application.job?.department_name ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                          {application.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            suppressHydrationWarning
                            onClick={() => setSheetId(application.id)}
                            className="text-xs text-[#64748d] transition-colors hover:text-[#533afd]"
                          >
                            Quick view
                          </button>
                          <span className="text-[#e5edf5]">|</span>
                          <Link
                            href={`/applications/${application.id}`}
                            className="text-xs text-brand-700 transition-colors hover:text-brand-500"
                          >
                            Full view
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ApplicationSheet applicationId={sheetId} onClose={() => setSheetId(null)} />
    </>
  )
}

export { ApplicationsClient }



