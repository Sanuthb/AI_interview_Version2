
import { NextRequest, NextResponse } from "next/server";
import { createCandidatesBulk } from "@/lib/services/candidates";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ interview_id: string }> } // Updated to match Next.js 15+ async params
) {
  try {
     const { interview_id } = await context.params;

    if (!interview_id) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { candidates } = body;

    if (!candidates || !Array.isArray(candidates)) {
      return NextResponse.json(
        { error: "Invalid candidates data. Expected an array." },
        { status: 400 }
      );
    }

    // Ensure all candidates have the interview_id
    const candidatesWithId = candidates.map((c: any) => ({
      ...c,
      interview_id,
    }));

    const result = await createCandidatesBulk(candidatesWithId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in bulk candidate upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
