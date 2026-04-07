import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { buttonVariants } from "@/components/ui/button"

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

const pageCount = (total: number, pageSize: number) =>
  Math.ceil(total / pageSize)

const Pagination = ({ className, page, pageSize, total, onPageChange, ...props }: PaginationProps) => {
  const totalPages = pageCount(total, pageSize)

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="pagination"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <PaginationButton
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PaginationButton>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis")
          acc.push(p)
          return acc
        }, [])
        .map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[#64748d]">
              …
            </span>
          ) : (
            <PaginationPage
              key={item}
              page={item as number}
              current={page}
              onClick={() => onPageChange(item as number)}
            />
          )
        )}

      <PaginationButton
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </nav>
  )
}

const PaginationButton = ({
  className,
  ...props
}: React.ComponentProps<"button"> & { children: React.ReactNode }) => (
  <button
    className={cn(
      buttonVariants({ variant: "ghost", size: "icon" }),
      "h-8 w-8",
      className
    )}
    {...props}
  />
)

const PaginationPage = ({
  page,
  current,
  onClick,
}: {
  page: number
  current: number
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      "h-8 w-8 rounded-md text-sm font-medium transition-colors",
      page === current
        ? "bg-[#533afd] text-white"
        : "text-[#64748d] hover:bg-[#f4f7ff] hover:text-[#061b31]"
    )}
  >
    {page}
  </button>
)

export { Pagination }

