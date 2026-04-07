import { notFound } from "next/navigation";

import { listDepartments } from "@/features/departments/service";
import { JobOpeningEditForm } from "@/features/jobs/job-opening-edit-form";
import { getJobOpeningDetails } from "@/features/jobs/service";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditJobOpeningPage({ params }: Props) {
  const { id } = await params;

  try {
    const [job, departments] = await Promise.all([getJobOpeningDetails(id), listDepartments()]);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#061b31]">Edit Job Opening</h2>
        <JobOpeningEditForm
          defaultValues={{
            job_title: job.job_title,
            department_id: job.department_id,
            role_type: job.role_type,
            employment_type: job.employment_type,
            description: job.description ?? "",
            qualifications: job.qualifications ?? ""
          }}
          departments={departments.map((department) => ({ id: department.id, department_name: department.department_name }))}
          jobId={job.id}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
