import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const { candidateId } = await req.json();
        console.log(candidateId);

        if (!candidateId) {
            return Response.json(
                { success: false, message: "candidateId is required" },
                { status: 400 }
            );
        }

        if (!adminSupabase) {
            console.error(
                "Supabase admin client (adminSupabase) is null. serviceRoleKey might be missing."
            );
            throw new Error("Supabase admin client is not configured");
        }

        const { data, error } = await adminSupabase.from("feedback_analysis").select("*").eq("candidate_id", candidateId).single();

        if (error) {
            console.error(error);
            return Response.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }

        return Response.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("Server error:", error);
        return Response.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}