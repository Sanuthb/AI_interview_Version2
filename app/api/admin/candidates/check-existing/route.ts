import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { usns, interviewId } = body as {
      usns?: string[];
      interviewId?: string;
    };

    if (!usns || !Array.isArray(usns) || usns.length === 0) {
      return NextResponse.json(
        { error: "usns array is required" },
        { status: 400 },
      );
    }

    if (!interviewId) {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 },
      );
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: "Admin Supabase client is not configured" },
        { status: 500 },
      );
    }

    // Check which USNs already exist in this interview
    const { data: existingCandidates, error } = await adminSupabase
      .from("candidates")
      .select("usn")
      .contains("interview_ids", [interviewId])
      .in("usn", usns);

    if (error) {
      console.error("Error checking existing candidates:", error);
      return NextResponse.json(
        { error: "Failed to check existing candidates" },
        { status: 500 },
      );
    }

    const existingUSNs = (existingCandidates || []).map((c) => c.usn);

    return NextResponse.json({
      success: true,
      existingUSNs,
    });
  } catch (error: any) {
    console.error("Error in check-existing API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
