import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const pageCount = (total: number, pageSize: number) => Math.ceil(total / pageSize);

const buildPageItems = (currentPage: number, totalPages: number): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    const pages: number[] = [];
    for (let value = 1; value <= totalPages; value += 1) {
      pages.push(value);
    }
    return pages;
  }

  const items: Array<number | "ellipsis"> = [1];
  const middleStart = Math.max(2, currentPage - 1);
  const middleEnd = Math.min(totalPages - 1, currentPage + 1);

  if (middleStart > 2) {
    items.push("ellipsis");
  }

  for (let value = middleStart; value <= middleEnd; value += 1) {
    items.push(value);
  }

  if (middleEnd < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
};

const Pagination = ({ className, page, pageSize, total, onPageChange, ...props }: PaginationProps) => {
  const totalPages = pageCount(total, pageSize);

  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const items = buildPageItems(currentPage, totalPages);

  return (
    <nav aria-label="pagination" className={cn("flex items-center justify-center gap-1", className)} {...props}>
      <PaginationButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PaginationButton>

      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-[#64748d]">
            ...
          </span>
        ) : (
          <PaginationPage key={item} page={item} current={currentPage} onClick={() => onPageChange(item)} />
        )
      )}

      <PaginationButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </nav>
  );
};

const PaginationButton = ({ className, ...props }: React.ComponentProps<"button"> & { children: React.ReactNode }) => (
  <button suppressHydrationWarning className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8", className)} {...props} />
);

const PaginationPage = ({
  page,
  current,
  onClick
}: {
  page: number;
  current: number;
  onClick: () => void;
}) => (
  <button
    suppressHydrationWarning
    onClick={onClick}
    className={cn(
      "h-8 w-8 rounded-md text-sm font-medium transition-colors",
      page === current ? "bg-[#533afd] text-white" : "text-[#64748d] hover:bg-[#f4f7ff] hover:text-[#061b31]"
    )}
  >
    {page}
  </button>
);

export { Pagination };
