import { NextRequest, NextResponse } from "next/server";
import { createAuthUsersForInterview } from "@/lib/services/admin-users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { interviewId } = body as { interviewId?: string };

    if (!interviewId) {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 }
      );
    }

    const result = await createAuthUsersForInterview(interviewId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating auth users for interview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create auth users" },
      { status: 500 }
    );
  }
}


