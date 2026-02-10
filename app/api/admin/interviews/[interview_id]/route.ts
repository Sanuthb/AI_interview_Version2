import { NextRequest, NextResponse } from "next/server";
import { deleteInterview } from "@/lib/services/interviews";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ interview_id: string }> }
) {
  try {
    const { interview_id: id } = await params;
    await deleteInterview(id);
    return NextResponse.json({ success: true, message: "Interview deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting interview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete interview" },
      { status: 500 }
    );
  }
}
