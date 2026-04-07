"use client"

import { useState, useMemo } from "react"

interface UseDataTableOptions<T> {
  data: T[]
  pageSize?: number
}

interface SortState<T> {
  key: keyof T | null
  direction: "asc" | "desc"
}

export function useDataTable<T>({ data, pageSize = 10 }: UseDataTableOptions<T>) {
  const [sort, setSort] = useState<SortState<T>>({ key: null, direction: "asc" })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    let result = [...data]

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const lower = value.toLowerCase()
      result = result.filter((item) => {
        const fieldValue = (item as Record<string, unknown>)[key]
        if (fieldValue == null) return false
        return String(fieldValue).toLowerCase().includes(lower)
      })
    }

    if (sort.key) {
      result.sort((a, b) => {
        const aVal = a[sort.key as keyof T]
        const bVal = b[sort.key as keyof T]
        if (aVal == null) return 1
        if (bVal == null) return -1
        const cmp = String(aVal).localeCompare(String(bVal))
        return sort.direction === "asc" ? cmp : -cmp
      })
    }

    return result
  }, [data, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, filteredData.length)

  const setSortKey = (key: keyof T, direction?: "asc" | "desc") => {
    setSort((prev) => ({
      key,
      direction: direction ?? (prev.key === key && prev.direction === "asc" ? "desc" : "asc"),
    }))
  }

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  return {
    filteredData,
    paginatedData,
    totalPages,
    startIndex,
    endIndex,
    sort,
    setSortKey,
    filters,
    setFilter,
    clearFilters,
    page,
    setPage,
  }
}
