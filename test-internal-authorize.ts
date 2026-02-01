import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function testInternalAuthorize() {
    const credentials = {
        email: "tanmayrana2001@gmail.com",
        password: "1NH24MC142@123",
    };

    console.log("Testing internal authorize logic with:", credentials);

    try {
        // 1) Find candidate
        console.log("Searching candidates...");
        const { data: candidate, error: candidateError } = await adminSupabase
            .from("candidates")
            .select("id, name, usn, email, batch, dept")
            .or(`usn.eq.${credentials.email},email.eq.${credentials.email}`)
            .single();

        if (candidateError) {
            console.error("Candidate search error:", candidateError);
            return;
        }
        if (!candidate) {
            console.error("Candidate not found");
            return;
        }

        console.log("Candidate found:", candidate);

        // 2) Check profile
        console.log("Checking user profile...");
        const { data: profile, error: profileError } = await adminSupabase
            .from("user_profiles")
            .select("*")
            .eq("candidate_id", candidate.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error("Profile check error:", profileError);
        } else {
            console.log("Profile found:", profile);
        }

        // 3) Validate password
        const expectedPassword = `${candidate.usn}@123`;
        console.log(`Comparing passwords: '${credentials.password}' vs '${expectedPassword}'`);

        if (credentials.password !== expectedPassword) {
            console.error("Password mismatch!");
            return;
        }

        console.log("Password matched! Success.");
        console.log("User object that would be returned:", {
            id: profile?.id || candidate.id,
            email: candidate.email,
            name: candidate.name,
            usn: candidate.usn,
            batch: candidate.batch,
            dept: candidate.dept,
            candidateId: candidate.id,
            role: "candidate",
        });

    } catch (error) {
        console.error("Internal authorize error:", error);
    }
}

testInternalAuthorize();
