"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { useApplicationsStore } from "@/features/applications/store"
import { PipelineColumn, COLUMNS } from "./pipeline-column"
import { PipelineCard } from "./pipeline-card"

interface PipelineBoardProps {
  initialApplications: {
    id: string
    applicantName: string
    jobTitle: string
    departmentName: string | null
    status: string
    submittedAt: string
    aiScore?: number
  }[]
  onQuickView: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => void
}

function PipelineBoard({ initialApplications, onQuickView, onStatusChange }: PipelineBoardProps) {
  const [activeCard, setActiveCard] = useState<typeof initialApplications[0] | null>(null)
  const { applications } = useApplicationsStore()

  const applications_ = applications.length > 0 ? applications : initialApplications

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const card = applications_.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const newStatus = over.id as string
    const app = applications_.find((c) => c.id === active.id)
    if (!app || app.status === newStatus) return

    onStatusChange(active.id as string, newStatus)
  }

  const getColumnCards = (columnId: string) =>
    applications_.filter((app) => app.status === columnId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-hidden pb-2"><div className="grid w-full grid-cols-7 gap-3">
        {COLUMNS.map((col) => (
          <PipelineColumn
            key={col.id}
            column={col}
            cards={getColumnCards(col.id)}
            onQuickView={onQuickView}
          />
        ))}
      </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <PipelineCard
            id={activeCard.id}
            applicantName={activeCard.applicantName}
            jobTitle={activeCard.jobTitle}
            departmentName={activeCard.departmentName}
            status={activeCard.status}
            submittedAt={activeCard.submittedAt}
            aiScore={activeCard.aiScore}
            onQuickView={onQuickView}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export { PipelineBoard }


