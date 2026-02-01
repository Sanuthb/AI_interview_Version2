import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInterviewsForUSN } from "@/lib/services/candidates";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.usn) {
      return NextResponse.json(
        { error: "Unauthorized - No USN found" },
        { status: 401 }
      );
    }

    // Get all interviews for this student
    const interviews = await getInterviewsForUSN(session.user.usn);

    return NextResponse.json({
      success: true,
      data: interviews,
    });
  } catch (error: any) {
    console.error("Error fetching student interviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
