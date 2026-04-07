"use client"

import { formatDistanceToNow } from "date-fns"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

interface PipelineCardProps {
  id: string
  applicantName: string
  jobTitle: string
  departmentName: string | null
  status: string
  submittedAt: string
  onQuickView: (id: string) => void
}

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
  submitted: "default",
  under_review: "default",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "warning",
  for_requirements: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "muted",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function PipelineCard({ id, applicantName, jobTitle, departmentName, status, submittedAt, onQuickView }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-xl border border-[#e5edf5] bg-[#ffffff] p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md hover:shadow-[#533afd]/10",
        isDragging && "opacity-50 shadow-lg shadow-[#533afd]/20 rotate-2"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(applicantName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#061b31] truncate">{applicantName}</p>
          <p className="text-xs text-[#64748d] truncate">{jobTitle}</p>
          {departmentName && (
            <p className="text-xs text-[#64748d] truncate">{departmentName}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={STATUS_BADGE[status] ?? "muted"} className="text-xs px-1.5 py-0.5">
          {status.replaceAll("_", " ")}
        </Badge>
        <span className="text-xs text-[#64748d]">
          {formatDistanceToNow(new Date(submittedAt), { addSuffix: false })}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onQuickView(id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="mt-2 w-full text-xs text-[#64748d] hover:text-[#533afd] transition-colors py-1"
      >
        Quick view
      </button>
    </div>
  )
}

export { PipelineCard }

