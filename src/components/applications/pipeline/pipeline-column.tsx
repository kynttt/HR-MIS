"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils/cn"
import { PipelineCard } from "./pipeline-card"

interface Column {
  id: string
  label: string
  color: string
}

const COLUMNS: Column[] = [
  { id: "submitted", label: "New", color: "#533afd" },
  { id: "under_review", label: "Under Review", color: "#60a5fa" },
  { id: "shortlisted", label: "Shortlisted", color: "#a78bfa" },
  { id: "interview_scheduled", label: "Interview", color: "#fbbf24" },
  { id: "interviewed", label: "Interviewed", color: "#fb923c" },
  { id: "accepted", label: "Accepted", color: "#34d399" },
  { id: "rejected", label: "Rejected", color: "#f87171" },
]

interface PipelineColumnProps {
  column: Column
  cards: {
    id: string
    applicantName: string
    jobTitle: string
    departmentName: string | null
    status: string
    submittedAt: string
    aiScore?: number
  }[]
  onQuickView: (id: string) => void
}

function PipelineColumn({ column, cards, onQuickView }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex min-w-0 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
        <h3 className="truncate text-sm font-semibold text-[#061b31]">{column.label}</h3>
        <span className="ml-auto rounded-full bg-[#e5edf5] px-2 py-0.5 text-xs text-[#64748d]">
          {cards.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          "min-w-0 flex-1 rounded-xl border border-[#e5edf5] bg-[#ffffff]/50 p-2 min-h-[400px] space-y-2 transition-colors",
          isOver && "border-[#533afd] bg-[#ffffff]"
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <PipelineCard
              key={card.id}
              {...card}
              onQuickView={onQuickView}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-[#64748d]">
            No applicants
          </div>
        )}
      </div>
    </div>
  )
}

export { PipelineColumn, COLUMNS }


