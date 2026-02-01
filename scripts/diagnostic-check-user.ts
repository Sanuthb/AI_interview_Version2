import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUser() {
    const email = "tanmayrana2001@gmail.com";
    const usn = "1NH24MC142";

    const { data: candidate } = await supabase
        .from("candidates")
        .select("*")
        .or(`usn.eq.${usn},email.eq.${email}`)
        .maybeSingle();

    console.log("Candidate found:", !!candidate);
    if (candidate) {
        console.log("Candidate USN:", candidate.usn);
        console.log("Candidate Email:", candidate.email);
        console.log("Expected Password:", `${candidate.usn}@123`);
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("usn", usn)
        .maybeSingle();

    console.log("Profile found:", !!profile);
    if (profile) {
        console.log("Profile ID:", profile.id);
    }
}

checkUser();
