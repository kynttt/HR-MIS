import { NextRequest, NextResponse } from "next/server";
import { rankSingleApplication } from "@/skills/ai-applicant-ranking/orchestrator";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await rankSingleApplication(id, { forceRecompute: true });
    if (!result) {
      return NextResponse.json({ error: "Ranking skipped (AI disabled or application not found)" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rank application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
