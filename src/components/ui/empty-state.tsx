import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[#64748d]">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-[#061b31] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748d] max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }

