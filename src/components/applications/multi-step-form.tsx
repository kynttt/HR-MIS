"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, UserRound } from "lucide-react";
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

const STEPS = ["Personal Information", "Documents", "Review and Submit"] as const;

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
    <div className="mb-8 grid gap-3 md:grid-cols-3">
      {STEPS.map((step, idx) => {
        const Icon = idx === 0 ? UserRound : idx === 1 ? FileText : CheckCircle2;
        const isDone = idx < current;
        const isCurrent = idx === current;

        return (
          <div
            key={step}
            className={cn(
              "rounded-lg border px-4 py-3 transition-colors",
              isDone || isCurrent ? "border-[#d6d9fc] bg-[#f4f6ff]" : "border-[#e5edf5] bg-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-xs",
                  isDone ? "bg-[#533afd] text-white" : isCurrent ? "border border-[#533afd] bg-[#eef2ff] text-[#533afd]" : "bg-[#eef2f7] text-[#64748d]"
                )}
              >
                {isDone ? "OK" : idx + 1}
              </div>
              <Icon className={cn("h-4 w-4", isDone || isCurrent ? "text-[#533afd]" : "text-[#64748d]")} />
              <p className={cn("text-sm", isDone || isCurrent ? "text-[#061b31]" : "text-[#64748d]")}>{step}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-500">{message}</p>;
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
    <Card className="rounded-xl border border-[#e5edf5] bg-white p-5 shadow-[0_18px_34px_-34px_rgba(6,27,49,0.65)] lg:p-6">
      <form onSubmit={handleSubmit(onNext)} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-12">
          <div className="md:col-span-12">
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
            <FieldError message={errors.job_opening_id?.message} />
          </div>

          <div className="md:col-span-4">
            <Label required>First Name</Label>
            <Input {...register("first_name")} placeholder="Maria" />
            <FieldError message={errors.first_name?.message} />
          </div>
          <div className="md:col-span-4">
            <Label>Middle Name</Label>
            <Input {...register("middle_name")} placeholder="Garcia" />
          </div>
          <div className="md:col-span-4">
            <Label required>Last Name</Label>
            <Input {...register("last_name")} placeholder="Santos" />
            <FieldError message={errors.last_name?.message} />
          </div>

          <div className="md:col-span-3">
            <Label>Suffix</Label>
            <Input {...register("suffix")} placeholder="Jr, Sr, III" />
          </div>
          <div className="md:col-span-5">
            <Label required>Email</Label>
            <Input {...register("email")} type="email" placeholder="maria@example.com" />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="md:col-span-4">
            <Label>Phone</Label>
            <Input {...register("phone")} type="tel" placeholder="+63 912 345 6789" />
          </div>

          <div className="md:col-span-12">
            <Label>Address</Label>
            <Textarea {...register("address")} placeholder="123 University Ave" />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit">Next: Upload Documents</Button>
        </div>
      </form>
    </Card>
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
  const documentCards: Array<{ key: string; label: string; accept: string }> = [
    { key: "resume", label: "Resume or CV", accept: ".pdf,.doc,.docx" },
    { key: "diploma", label: "Diploma", accept: ".pdf,.doc,.docx" },
    { key: "tor", label: "Transcript of Records", accept: ".pdf,.doc,.docx" },
    { key: "certificates", label: "Certificates or Training", accept: ".pdf,.doc,.docx,.zip" }
  ];

  return (
    <Card className="rounded-xl border border-[#e5edf5] bg-white p-5 shadow-[0_18px_34px_-34px_rgba(6,27,49,0.65)] lg:p-6">
      <div className="space-y-5">
        <p className="text-sm text-[#64748d]">Upload your supporting documents. You can continue even if some files are not available yet.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {documentCards.map((item) => (
            <div key={item.key} className="rounded-lg border border-[#e5edf5] bg-[#f8fafe] p-4">
              <Label>{item.label}</Label>
              <div className="mt-2">
                <FileUpload accept={item.accept} onFilesChange={(f) => onFilesChange(item.key, f)} />
              </div>
              {files[item.key]?.[0] ? <p className="mt-2 text-xs text-[#533afd]">{files[item.key][0].name}</p> : null}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-1">
          <Button variant="secondary" onClick={onBack} type="button">
            Back
          </Button>
          <Button onClick={onNext} type="button">
            Next: Review
          </Button>
        </div>
      </div>
    </Card>
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
    <Card className="rounded-xl border border-[#e5edf5] bg-white p-5 shadow-[0_18px_34px_-34px_rgba(6,27,49,0.65)] lg:p-6">
      <div className="space-y-4">
        <p className="text-sm text-[#64748d]">Review your details before final submission.</p>

        <div className="rounded-lg border border-[#e5edf5] bg-[#f8fafc] p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#64748d]">Position</p>
            <p className="text-sm text-[#061b31]">
              {selectedJob ? `${selectedJob.job_title} - ${selectedJob.department_name ?? "No department"} (${selectedJob.role_type})` : data.job_opening_id}
            </p>
          </div>
          <Separator className="my-3" />
          <div className="grid gap-3 md:grid-cols-2">
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
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting} type="button">
            Back
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} type="button">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SuccessState() {
  return (
    <Card className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-emerald-200 bg-white py-12 text-center shadow-[0_18px_34px_-34px_rgba(16,185,129,0.65)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">OK</div>
      <div>
        <h3 className="text-lg font-semibold text-[#061b31]">Application Submitted</h3>
        <p className="mt-1 text-sm text-[#64748d]">Thank you for your interest. Our HR team will review your application and contact you soon.</p>
      </div>
    </Card>
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
