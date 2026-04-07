"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { TableHead } from "@/components/ui/table"

interface SortHeaderProps {
  name: string
  label: string
  currentSort: string
  currentOrder: "asc" | "desc"
}

const SORT_KEY_MAP: Record<string, string> = {
  title: "job_title",
  department: "department_name",
  status: "status",
  created: "created_at",
}

export function SortHeader({ name, label, currentSort, currentOrder }: SortHeaderProps) {
  const searchParams = useSearchParams()

  const isActive = currentSort === name
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc"
  const sortKey = SORT_KEY_MAP[name] ?? name

  const params = new URLSearchParams(searchParams.toString())
  params.set("sort", sortKey)
  params.set("order", nextOrder)

  return (
    <TableHead className="cursor-pointer select-none">
      <Link
        href={`?${params.toString()}`}
        className={cn(
          "flex items-center gap-1 hover:text-[#061b31] transition-colors",
          isActive ? "text-[#061b31]" : "text-[#64748d]"
        )}
      >
        {label}
        {isActive && (
          currentOrder === "asc"
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />
        )}
      </Link>
    </TableHead>
  )
}

