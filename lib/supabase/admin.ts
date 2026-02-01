import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// console.log("supabaseUrl:", supabaseUrl);
// console.log("serviceRoleKey:", serviceRoleKey);

if (!supabaseUrl || !serviceRoleKey) {
  if (typeof window === "undefined") {
    console.warn(
      "Supabase service role environment variables are not set. Admin operations will not work."
    );
  }
}

// Server-only Supabase client with service role.
export const adminSupabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
