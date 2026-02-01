import { NextRequest, NextResponse } from "next/server";
import { searchRegisteredUsers, addCandidateToInterview } from "@/lib/services/candidates";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const users = await searchRegisteredUsers(query, id);
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error searching candidates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search candidates" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await params;
    const { usn } = await req.json();

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const candidate = await addCandidateToInterview(usn, interviewId);
    return NextResponse.json({ success: true, data: candidate });
  } catch (error: any) {
    console.error("Error adding candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add candidate" },
      { status: 500 }
    );
  }
}
