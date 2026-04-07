"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface FilterOption {
  value: string
  label: string
}

interface Filter {
  name: string
  label: string
  type: "text" | "select"
  options?: FilterOption[]
  placeholder?: string
}

interface FilterBarProps {
  filters: Filter[]
  onClear?: () => void
}

function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

  return (
    <div className={`grid gap-2 ${filters.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      {filters.map((filter) => {
        if (filter.type === "text") {
          return (
            <Input
              key={filter.name}
              name={filter.name}
              placeholder={filter.placeholder ?? filter.label}
              defaultValue={searchParams.get(filter.name) ?? ""}
              onChange={(e) => handleChange(filter.name, e.target.value)}
            />
          )
        }
        return (
          <Select
            key={filter.name}
            name={filter.name}
            defaultValue={searchParams.get(filter.name) ?? ""}
            onChange={(e) => handleChange(filter.name, e.target.value)}
          >
            <option value="">{filter.placeholder ?? filter.label}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )
      })}
    </div>
  )
}

export { FilterBar }
