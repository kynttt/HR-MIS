"use client";

import { useMemo, useState } from "react";
import { Briefcase, Users, Search, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { RankedApplicantCard } from "@/components/applicants/ranked-applicant-card";
import type { RankedApplicant } from "@/features/jobs/types";

interface JobApplicantsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  orgName: string;
  applicants: RankedApplicant[];
  isLoading?: boolean;
}

type SortOption = "score_desc" | "score_asc" | "date_desc" | "date_asc";

export function JobApplicantsSheet({
  isOpen,
  onClose,
  jobTitle,
  orgName,
  applicants,
  isLoading = false
}: JobApplicantsSheetProps) {
  const [sortBy, setSortBy] = useState<SortOption>("score_desc");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedApplicants = useMemo(() => {
    let result = [...applicants];

    // Filter by status
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "score_desc":
          return b.aiScore - a.aiScore;
        case "score_asc":
          return a.aiScore - b.aiScore;
        case "date_desc":
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case "date_asc":
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [applicants, sortBy, statusFilter, searchQuery]);

  const handleShortlist = (id: string) => {
    console.log("Shortlist:", id);
  };

  const handleInterview = (id: string) => {
    console.log("Interview:", id);
  };

  const handleReject = (id: string) => {
    console.log("Reject:", id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="border-b border-[#e5edf5] pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-5 w-5 text-[#533afd]" />
                {jobTitle}
              </SheetTitle>
              <p className="text-sm text-[#64748d]">{orgName}</p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {applicants.length} applicants
            </Badge>
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="mt-4 space-y-3 border-b border-[#e5edf5] pb-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748d]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interviewed">Interviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </Select>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          {isLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#e5edf5] bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="mt-2 h-4 w-48" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredAndSortedApplicants.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-8 text-center">
              <Filter className="h-12 w-12 text-[#64748d]" />
              <h3 className="mt-4 text-lg font-medium text-[#061b31]">
                No applicants found
              </h3>
              <p className="mt-2 text-sm text-[#64748d]">
                Try adjusting your filters or search query.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setStatusFilter("");
                  setSearchQuery("");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            // List
            filteredAndSortedApplicants.map((applicant, index) => (
              <RankedApplicantCard
                key={applicant.id}
                applicant={applicant}
                rank={index + 1}
                onShortlist={handleShortlist}
                onInterview={handleInterview}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
