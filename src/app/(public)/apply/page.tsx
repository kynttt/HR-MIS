import { listOpenJobOpenings } from "@/features/jobs/service"
import { MultiStepApplyForm } from "@/components/applications/multi-step-form"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PublicApplyPage({ searchParams }: Props) {
  const query = await searchParams
  const jobs = await listOpenJobOpenings()
  const isSuccess = query.success === "1"
  const errorMessage = typeof query.error === "string" ? query.error : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-[#e5edf5] bg-[#f6f9fc] p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#061b31]">University HRMIS Application Portal</h1>
          <p className="mt-1 text-sm text-[#64748d]">Submit your application for faculty and staff openings.</p>
        </div>

        <MultiStepApplyForm
          jobs={jobs}
          isSuccess={isSuccess}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}

