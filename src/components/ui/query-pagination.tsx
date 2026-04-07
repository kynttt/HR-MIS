"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/ui/pagination";

type QueryPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
};

export function QueryPagination({ page, pageSize, total }: QueryPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[#e5edf5] bg-[#ffffff] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-xs text-[#64748d]">
        Showing <span className="font-medium text-[#061b31]">{from}</span>-<span className="font-medium text-[#061b31]">{to}</span> of <span className="font-medium text-[#061b31]">{total}</span>
      </p>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(targetPage) => {
          const nextPage = Math.min(Math.max(targetPage, 1), totalPages);
          const params = new URLSearchParams(searchParams.toString());
          if (nextPage === 1) {
            params.delete("page");
          } else {
            params.set("page", String(nextPage));
          }
          router.push(`?${params.toString()}`);
        }}
      />
    </div>
  );
}
