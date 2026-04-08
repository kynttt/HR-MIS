"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { submitApplicationAction } from "@/features/applications/actions";
import { cn } from "@/lib/utils/cn";

const STEPS = ["Personal Information", "Documents", "Review & Submit"] as const;

const personalInfoSchema = z.object({
  job_opening_id: z.string().uuid(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional()
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;

type JobOption = { id: string; job_title: string; department_name: string | null; role_type: string };

interface MultiStepApplyFormProps {
  jobs: JobOption[];
  isSuccess?: boolean;
  errorMessage?: string | null;
  fixedJobId?: string;
  returnPath?: string;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                idx < current
                  ? "bg-[#533afd] text-white"
                  : idx === current
                    ? "border-2 border-[#533afd] bg-[#533afd]/30 text-[#533afd]"
                    : "bg-[#e5edf5] text-[#64748d]"
              )}
            >
              {idx < current ? "OK" : idx + 1}
            </div>
            <span className={cn("text-xs", idx === current ? "text-[#061b31]" : "text-[#64748d]")}>{step}</span>
          </div>
          {idx < STEPS.length - 1 && <div className={cn("mx-1 h-[2px] w-12", idx < current ? "bg-[#533afd]" : "bg-[#e5edf5]")} />}
        </div>
      ))}
    </div>
  );
}

function PersonalInfoStep({
  jobs,
  onNext,
  defaultValues,
  fixedJobId
}: {
  jobs: JobOption[];
  onNext: (data: PersonalInfo) => void;
  defaultValues?: Partial<PersonalInfo>;
  fixedJobId?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      ...defaultValues,
      job_opening_id: defaultValues?.job_opening_id ?? fixedJobId ?? ""
    }
  });

  const selectedJob = fixedJobId ? jobs.find((job) => job.id === fixedJobId) : null;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label required>Job Opening</Label>
        {selectedJob ? (
          <>
            <Input value={`${selectedJob.job_title} - ${selectedJob.department_name ?? "No department"} (${selectedJob.role_type})`} readOnly />
            <input type="hidden" value={selectedJob.id} {...register("job_opening_id")} />
          </>
        ) : (
          <Select {...register("job_opening_id")}>
            <option value="">Select a position...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.job_title} - {job.department_name ?? "No department"} ({job.role_type})
              </option>
            ))}
          </Select>
        )}
        {errors.job_opening_id ? <p className="mt-1 text-xs text-rose-500">{errors.job_opening_id.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label required>First Name</Label>
          <Input {...register("first_name")} placeholder="Maria" />
          {errors.first_name ? <p className="mt-1 text-xs text-rose-500">{errors.first_name.message}</p> : null}
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input {...register("last_name")} placeholder="Santos" />
          {errors.last_name ? <p className="mt-1 text-xs text-rose-500">{errors.last_name.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Middle Name</Label>
          <Input {...register("middle_name")} placeholder="Garcia" />
        </div>
        <div>
          <Label>Suffix</Label>
          <Input {...register("suffix")} placeholder="Jr, Sr, III" />
        </div>
        <div>
          <Label required>Email</Label>
          <Input {...register("email")} type="email" placeholder="maria@example.com" />
          {errors.email ? <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p> : null}
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
        <Textarea {...register("address")} placeholder="123 University Ave" />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit">Next: Upload Documents</Button>
      </div>
    </form>
  );
}

function DocumentsStep({
  onNext,
  onBack,
  files,
  onFilesChange
}: {
  onNext: () => void;
  onBack: () => void;
  files: Record<string, File[]>;
  onFilesChange: (name: string, files: File[]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748d]">Upload supporting documents. All fields are optional but recommended.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Resume / CV</Label>
          <FileUpload accept=".pdf,.doc,.docx" onFilesChange={(f) => onFilesChange("resume", f)} />
          {files.resume[0] ? <p className="mt-1 text-xs text-[#533afd]">{files.resume[0].name}</p> : null}
        </div>
        <div>
          <Label>Diploma</Label>
          <FileUpload accept=".pdf,.doc,.docx" onFilesChange={(f) => onFilesChange("diploma", f)} />
          {files.diploma[0] ? <p className="mt-1 text-xs text-[#533afd]">{files.diploma[0].name}</p> : null}
        </div>
        <div>
          <Label>Transcript of Records (TOR)</Label>
          <FileUpload accept=".pdf,.doc,.docx" onFilesChange={(f) => onFilesChange("tor", f)} />
          {files.tor[0] ? <p className="mt-1 text-xs text-[#533afd]">{files.tor[0].name}</p> : null}
        </div>
        <div>
          <Label>Certificates / Training</Label>
          <FileUpload accept=".pdf,.doc,.docx,.zip" onFilesChange={(f) => onFilesChange("certificates", f)} />
          {files.certificates[0] ? <p className="mt-1 text-xs text-[#533afd]">{files.certificates[0].name}</p> : null}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack} type="button">
          Back
        </Button>
        <Button onClick={onNext} type="button">
          Next: Review
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  data,
  jobs,
  onBack,
  onSubmit,
  isSubmitting
}: {
  data: PersonalInfo;
  jobs: JobOption[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const selectedJob = jobs.find((job) => job.id === data.job_opening_id);
  const fullName = [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748d]">Review your information before submitting.</p>

      <Card className="space-y-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#64748d]">Position</p>
          <p className="text-sm text-[#061b31]">
            {selectedJob ? `${selectedJob.job_title} - ${selectedJob.department_name ?? "No department"} (${selectedJob.role_type})` : data.job_opening_id}
          </p>
        </div>
        <Separator />
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className="text-xs text-[#64748d]">Full Name</p>
            <p className="text-sm text-[#061b31]">
              {fullName}
              {data.suffix ? `, ${data.suffix}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Email</p>
            <p className="text-sm text-[#061b31]">{data.email}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Phone</p>
            <p className="text-sm text-[#061b31]">{data.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748d]">Address</p>
            <p className="text-sm text-[#061b31]">{data.address || "-"}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting} type="button">
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} type="button">
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">OK</div>
      <div>
        <h3 className="text-lg font-semibold text-[#061b31]">Application Submitted</h3>
        <p className="mt-1 text-sm text-[#64748d]">Thank you for your interest. Our HR team will review your application and contact you soon.</p>
      </div>
    </div>
  );
}

export function MultiStepApplyForm({ jobs, isSuccess, errorMessage, fixedJobId, returnPath }: MultiStepApplyFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<PersonalInfo | null>(null);
  const [files, setFiles] = useState<Record<string, File[]>>({
    resume: [],
    diploma: [],
    tor: [],
    certificates: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSuccess) {
    return <SuccessState />;
  }

  const handleFilesChange = (name: string, newFiles: File[]) => {
    setFiles((prev) => ({ ...prev, [name]: newFiles }));
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.set("job_opening_id", formData.job_opening_id);
      formDataToSend.set("first_name", formData.first_name);
      if (formData.middle_name) formDataToSend.set("middle_name", formData.middle_name);
      formDataToSend.set("last_name", formData.last_name);
      if (formData.suffix) formDataToSend.set("suffix", formData.suffix);
      formDataToSend.set("email", formData.email);
      if (formData.phone) formDataToSend.set("phone", formData.phone);
      if (formData.address) formDataToSend.set("address", formData.address);
      formDataToSend.set("return_to", returnPath ?? (fixedJobId ? `/apply/${fixedJobId}` : "/apply"));

      for (const [name, fileList] of Object.entries(files)) {
        if (fileList[0]) formDataToSend.set(name, fileList[0]);
      }

      await submitApplicationAction(formDataToSend);
    } catch (error) {
      const isRedirectControlFlow =
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");

      if (isRedirectControlFlow) {
        throw error;
      }

      toast.error("Failed to submit application. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <StepIndicator current={step} />

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      ) : null}

      {step === 0 ? (
        <PersonalInfoStep
          jobs={jobs}
          fixedJobId={fixedJobId}
          onNext={(data) => {
            setFormData(data);
            setStep(1);
          }}
          defaultValues={formData ?? undefined}
        />
      ) : null}

      {step === 1 ? <DocumentsStep onNext={() => setStep(2)} onBack={() => setStep(0)} files={files} onFilesChange={handleFilesChange} /> : null}

      {step === 2 && formData ? (
        <ReviewStep data={formData} jobs={jobs} onBack={() => setStep(1)} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      ) : null}
    </div>
  );
}

