import { adminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCandidateByUserId } from "@/lib/services/candidates";


export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const candidate = await getCandidateByUserId(session.user.id);
        if (!candidate) {
             return NextResponse.json(
                { success: false, message: "Candidate not found" },
                { status: 404 }
            );
        }

        if (!adminSupabase) {
            throw new Error("Supabase admin client is not configured");
        }

        // Fetch all interview results (history) for this candidate
        const { data: allInterviews, error: historyError } = await adminSupabase
            .from("feedback_analysis")
            .select("*")
            .eq("candidate_id", candidate.id)
            .order("created_at", { ascending: false });

        if (historyError) {
            console.error("History fetch error:", historyError);
            throw historyError;
        }

        if (!allInterviews || allInterviews.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    allInterviews: [],
                    latest: null
                }
            });
        }

        // Map 'analysis' column to 'report' property for frontend compatibility
        const mappedInterviews = allInterviews.map((item: any) => ({
            ...item,
            report: item.analysis
        }));

        return NextResponse.json({
            success: true,
            data: {
                allInterviews: mappedInterviews,
                latest: mappedInterviews[0] // Latest one due to descending order
            }
        });

    } catch (error) {
        console.error("GET Final Analysis error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { candidateId } = await req.json();

        if (!candidateId) {
            return NextResponse.json(
                { success: false, message: "candidateId is required" },
                { status: 400 }
            );
        }

        if (!adminSupabase) {
            throw new Error("Supabase admin client is not configured");
        }

        const { data, error } = await adminSupabase.from("feedback_analysis").select("*").eq("candidate_id", candidateId).single();

        if (error) {
            console.error(error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }

        const mappedData = data ? { ...data, report: data.analysis } : null;

        return NextResponse.json({ success: true, data: mappedData }, { status: 200 });
    } catch (error) {
        console.error("POST Final Analysis error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}