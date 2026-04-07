"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils/cn"
import { submitApplicationAction } from "@/features/applications/actions"

const STEPS = ["Personal Information", "Documents", "Review & Submit"] as const

const personalInfoSchema = z.object({
  job_opening_id: z.string().uuid(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type PersonalInfo = z.infer<typeof personalInfoSchema>

interface MultiStepApplyFormProps {
  jobs: { id: string; job_title: string; department_name: string | null; role_type: string }[]
  isSuccess?: boolean
  errorMessage?: string | null
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                idx < current
                  ? "bg-[#533afd] text-white"
                  : idx === current
                  ? "bg-[#533afd]/30 text-[#533afd] border-2 border-[#533afd]"
                  : "bg-[#e5edf5] text-[#64748d]"
              )}
            >
              {idx < current ? "✓" : idx + 1}
            </div>
            <span className={cn("text-xs", idx === current ? "text-[#061b31]" : "text-[#64748d]")}>
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn("h-[2px] w-12 mx-1", idx < current ? "bg-[#533afd]" : "bg-[#e5edf5]")} />
          )}
        </div>
      ))}
    </div>
  )
}

function PersonalInfoStep({
  jobs,
  onNext,
  defaultValues,
}: {
  jobs: MultiStepApplyFormProps["jobs"]
  onNext: (data: PersonalInfo) => void
  defaultValues?: Partial<PersonalInfo>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label required>Job Opening</Label>
        <Select {...register("job_opening_id")}>
          <option value="">Select a position...</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.job_title} — {job.department_name} ({job.role_type})
            </option>
          ))}
        </Select>
        {errors.job_opening_id && (
          <p className="mt-1 text-xs text-rose-400">{errors.job_opening_id.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label required>First Name</Label>
          <Input {...register("first_name")} placeholder="Maria" />
          {errors.first_name && (
            <p className="mt-1 text-xs text-rose-400">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input {...register("last_name")} placeholder="Santos" />
          {errors.last_name && (
            <p className="mt-1 text-xs text-rose-400">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Middle Name</Label>
          <Input {...register("middle_name")} placeholder="Garcia" />
        </div>
        <div>
          <Label>Suffix</Label>
          <Input {...register("suffix")} placeholder="Jr., Sr., III" />
        </div>
        <div>
          <Label required>Email</Label>
          <Input {...register("email")} type="email" placeholder="maria.santos@university.edu" />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Phone</Label>
          <Input {...register("phone")} type="tel" placeholder="+63 912 345 6789" />
        </div>
      </div>

      <div>
        <Label>Address</Label>
        <Textarea {...register("address")} placeholder="123 University Ave, Quezon City, Philippines" />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit">Next: Upload Documents →</Button>
      </div>
    </form>
  )
}

function DocumentsStep({
  onNext,
  onBack,
  files,
  onFilesChange,
}: {
  onNext: () => void
  onBack: () => void
  files: Record<string, File[]>
  onFilesChange: (name: string, files: File[]) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748d]">
        Upload supporting documents. All fields are optional but recommended.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Resume / CV</Label>
          <FileUpload
            accept=".pdf,.doc,.docx"
            onFilesChange={(f) => onFilesChange("resume", f)}
          />
          {files.resume.length > 0 && (
            <p className="mt-1 text-xs text-[#533afd]">{files.resume[0].name}</p>
          )}
        </div>
        <div>
          <Label>Diploma</Label>
          <FileUpload
            accept=".pdf,.doc,.docx"
            onFilesChange={(f) => onFilesChange("diploma", f)}
          />
          {files.diploma.length > 0 && (
            <p className="mt-1 text-xs text-[#533afd]">{files.diploma[0].name}</p>
          )}
        </div>
        <div>
          <Label>Transcript of Records (TOR)</Label>
          <FileUpload
            accept=".pdf,.doc,.docx"
            onFilesChange={(f) => onFilesChange("tor", f)}
          />
          {files.tor.length > 0 && (
            <p className="mt-1 text-xs text-[#533afd]">{files.tor[0].name}</p>
          )}
        </div>
        <div>
          <Label>Certificates / Training</Label>
          <FileUpload
            accept=".pdf,.doc,.docx,.zip"
            onFilesChange={(f) => onFilesChange("certificates", f)}
          />
          {files.certificates.length > 0 && (
            <p className="mt-1 text-xs text-[#533afd]">{files.certificates[0].name}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>Next: Review</Button>
      </div>
    </div>
  )
}

function ReviewStep({
  data,
  jobs,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  data: PersonalInfo
  jobs: { id: string; job_title: string; department_name: string | null; role_type: string }[]
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const selectedJob = jobs.find((j) => j.id === data.job_opening_id)
  const fullName = [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(" ")

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748d]">Review your information before submitting.</p>

      <Card className="p-4 space-y-3">
        <div>
          <p className="text-xs text-[#64748d] uppercase tracking-wide">Position</p>
          <p className="text-sm text-[#061b31]">
            {selectedJob ? `${selectedJob.job_title} — ${selectedJob.department_name} (${selectedJob.role_type})` : data.job_opening_id}
          </p>
        </div>
        <Separator />
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className="text-xs text-[#64748d]">Full Name</p>
            <p className="text-sm text-[#061b31]">
              {fullName}{data.suffix ? `, ${data.suffix}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Email</p>
            <p className="text-sm text-[#061b31]">{data.email}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Phone</p>
            <p className="text-sm text-[#061b31]">{data.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Address</p>
            <p className="text-sm text-[#061b31]">{data.address || "—"}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>← Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#061b31]">Application Submitted!</h3>
        <p className="mt-1 text-sm text-[#64748d]">
          Thank you for your interest. Our HR team will review your application and contact you soon.
        </p>
      </div>
      <p className="text-xs text-[#64748d]">
        A confirmation email has been sent to your email address.
      </p>
    </div>
  )
}

export function MultiStepApplyForm({ jobs, isSuccess, errorMessage }: MultiStepApplyFormProps) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<PersonalInfo | null>(null)
  const [files, setFiles] = useState<Record<string, File[]>>({
    resume: [],
    diploma: [],
    tor: [],
    certificates: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isSuccess) {
    return <SuccessState />
  }

  const handleFilesChange = (name: string, newFiles: File[]) => {
    setFiles((prev) => ({ ...prev, [name]: newFiles }))
  }

  const handleSubmit = async () => {
    if (!formData) return
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.set("job_opening_id", formData.job_opening_id)
      formDataToSend.set("first_name", formData.first_name)
      if (formData.middle_name) formDataToSend.set("middle_name", formData.middle_name)
      formDataToSend.set("last_name", formData.last_name)
      if (formData.suffix) formDataToSend.set("suffix", formData.suffix)
      formDataToSend.set("email", formData.email)
      if (formData.phone) formDataToSend.set("phone", formData.phone)
      if (formData.address) formDataToSend.set("address", formData.address)

      for (const [name, fileList] of Object.entries(files)) {
        if (fileList[0]) formDataToSend.set(name, fileList[0])
      }

      await submitApplicationAction(formDataToSend)
    } catch {
      toast.error("Failed to submit application. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <StepIndicator current={step} />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <p className="text-sm text-rose-400">{errorMessage}</p>
        </div>
      )}

      {step === 0 && (
        <PersonalInfoStep
          jobs={jobs}
          onNext={(data) => {
            setFormData(data)
            setStep(1)
          }}
          defaultValues={formData ?? undefined}
        />
      )}

      {step === 1 && (
        <DocumentsStep
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          files={files}
          onFilesChange={handleFilesChange}
        />
      )}

      {step === 2 && formData && (
        <ReviewStep
          data={formData}
          jobs={jobs}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

