import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { listDepartments } from "@/features/departments/service"
import { JobOpeningCreateForm } from "@/features/jobs/job-opening-create-form"

export default async function CreateJobOpeningPage() {
  const departments = await listDepartments()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]">
          <Plus className="h-6 w-6" />
          Create Job Opening
        </h2>
        <Button asChild type="button" variant="secondary">
          <Link href="/jobs">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <JobOpeningCreateForm departments={departments.map((d) => ({ id: d.id, department_name: d.department_name }))} />
    </div>
  )
}
