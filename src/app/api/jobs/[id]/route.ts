import { NextRequest, NextResponse } from "next/server";
import { getPublicJobOpeningDetails } from "@/features/jobs/service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const job = await getPublicJobOpeningDetails(id);
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
}
