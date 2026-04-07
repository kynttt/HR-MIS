import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label required={required}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}
    </div>
  )
}

export { FormField }
