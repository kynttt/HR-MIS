"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow, format } from "date-fns"
import { getApplicationDetailsAction } from "@/features/applications/actions"
import Link from "next/link"
import { FileText, MessageSquare, History, User } from "lucide-react"
import type { ApplicationDetails } from "@/features/applications/service"
import { ApplicationDocumentRemoveButton } from "@/features/applications/application-document-remove-button"

interface ApplicationSheetProps {
  applicationId: string | null
  onClose: () => void
}

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
  submitted: "default",
  under_review: "default",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "warning",
  for_requirements: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "muted",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function ApplicationSheet({ applicationId, onClose }: ApplicationSheetProps) {
  const [data, setData] = useState<ApplicationDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!applicationId) return
    setLoading(true)
    getApplicationDetailsAction(applicationId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [applicationId])

  const open = !!applicationId

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader className="sr-only">
        <SheetTitle>Application quick view</SheetTitle>
        <SheetDescription>Review applicant details, documents, notes, and status history.</SheetDescription>
      </SheetHeader>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {data && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(`${data.applicant.first_name} ${data.applicant.last_name}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-[#061b31]">
                    {data.applicant.first_name} {data.applicant.last_name}
                  </p>
                  <p className="text-sm font-normal text-[#64748d]">{data.applicant.email}</p>
                </div>
              </SheetTitle>
              <SheetDescription className="pt-1">
                <Badge variant={STATUS_BADGE[data.status] ?? "muted"} className="mt-1">
                  {data.status.replaceAll("_", " ")}
                </Badge>
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-2">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="overview" className="text-xs"><User className="h-3 w-3 mr-1" />Info</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs"><FileText className="h-3 w-3 mr-1" />Docs</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />Notes</TabsTrigger>
                <TabsTrigger value="history" className="text-xs"><History className="h-3 w-3 mr-1" />History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#e5edf5] bg-[#ffffff] p-4 space-y-3">
                  <div>
                    <p className="text-xs text-[#64748d] uppercase tracking-wide mb-1">Contact</p>
                    <p className="text-sm text-[#061b31]">{data.applicant.phone ?? "No phone"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-[#64748d] uppercase tracking-wide mb-1">Applied</p>
                    <p className="text-sm text-[#061b31]">
                      {format(new Date(data.submitted_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                  {data.converted_employee_id && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Converted to Employee</Badge>
                      </div>
                    </>
                  )}
                </div>

                <Link href={`/applications/${applicationId}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Open Full Application
                  </Button>
                </Link>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                {data.documents.length === 0 ? (
                  <p className="text-sm text-[#64748d] text-center py-6">No documents uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {data.documents.map((doc) => (
                      <div key={doc.id} className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-[#64748d] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#061b31] truncate">{doc.original_file_name ?? doc.document_type}</p>
                            <p className="text-xs text-[#64748d] capitalize">{doc.document_type}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-[#533afd] hover:underline"
                            >
                              View
                            </a>
                            <ApplicationDocumentRemoveButton
                              applicationId={data.id}
                              documentId={doc.id}
                              fileName={doc.original_file_name ?? doc.document_type}
                              onRemoved={() => {
                                setData((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        documents: previous.documents.filter((item) => item.id !== doc.id)
                                      }
                                    : previous
                                )
                              }}
                            />
                          </div>
                        </div>
                        {doc.is_image ? (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block max-w-full">
                            <img
                              src={doc.file_url}
                              alt={doc.original_file_name ?? `${doc.document_type} image`}
                              className="h-24 w-40 max-w-full rounded-md border border-[#e5edf5] bg-[#f8fafc] object-contain"
                            />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                {data.notes.length === 0 ? (
                  <p className="text-sm text-[#64748d] text-center py-6">No notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-3">
                        <p className="text-sm text-[#061b31] whitespace-pre-wrap">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {data.status_history.length === 0 ? (
                  <p className="text-sm text-[#64748d] text-center py-6">No status history.</p>
                ) : (
                  <div className="space-y-3">
                    {data.status_history
                      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                      .map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-[#533afd] shrink-0" />
                          <div>
                            <p className="text-sm text-[#061b31]">
                              {item.from_status ? `${item.from_status.replaceAll("_", " ")} → ` : ""}
                              <span className="text-[#533afd]">{item.to_status.replaceAll("_", " ")}</span>
                            </p>
                            <p className="text-xs text-[#64748d]">
                              {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
                            </p>
                            {item.from_status && (
                              <Badge variant="muted" className="mt-1 text-xs">{item.from_status.replaceAll("_", " ")}</Badge>
                            )}
                            <Badge variant="success" className="mt-1 ml-1 text-xs">{item.to_status.replaceAll("_", " ")}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}









