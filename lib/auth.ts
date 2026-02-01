import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminSupabase } from "./supabase/admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      usn: string;
      batch: string;
      dept: string;
      candidateId: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    usn: string;
    batch: string;
    dept: string;
    candidateId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    usn: string;
    batch: string;
    dept: string;
    candidateId: string;
    role: string;
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check if adminSupabase is available
        if (!adminSupabase) {
          console.error("Admin Supabase client is not configured");
          return null;
        }

        try {
          // First, check if this is an admin login
          const { data: adminUser, error: adminError } = await adminSupabase
            .from("admin_users")
            .select("*")
            .eq("email", credentials.email)
            .maybeSingle();

          if (adminUser) {
            // Admin found, validate password against database
            if (credentials.password !== adminUser.password) {
              console.error("Invalid admin password");
              return null;
            }

            // Return admin user
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              usn: "", // Admins don't have USN
              batch: "",
              dept: "",
              candidateId: "",
              role: adminUser.role, // 'admin' or 'super_admin'
            };
          }

          // Not an admin, try candidate login
          // First try to find user by USN or email in candidates table
          const { data: candidate, error: candidateError } = await adminSupabase
            .from("candidates")
            .select("id, name, usn, email, batch, dept")
            .or(`usn.eq.${credentials.email},email.eq.${credentials.email}`)
            .single();

          if (candidateError || !candidate) {
            console.error("User not found in candidates:", candidateError);
            return null;
          }

          // Check if user profile exists for this candidate
          const { data: profile, error: profileError } = await adminSupabase
            .from("user_profiles")
            .select("*")
            .eq("candidate_id", candidate.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 = no rows returned
            console.error("Error checking user profile:", profileError);
            return null;
          }

          // For demo purposes, we'll use a simple password validation
          // In production, you should hash passwords and store them securely
          const expectedPassword = `${candidate.usn}@123`;

          if (credentials.password !== expectedPassword) {
            console.error("Invalid password");
            return null;
          }

          return {
            id: profile?.id || candidate.id, // Use profile ID if exists, otherwise candidate ID
            email: candidate.email,
            name: candidate.name,
            usn: candidate.usn,
            batch: candidate.batch,
            dept: candidate.dept,
            candidateId: candidate.id,
            role: profile?.role || "candidate",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.usn = user.usn;
        token.batch = user.batch;
        token.dept = user.dept;
        token.candidateId = user.candidateId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.usn = token.usn;
        session.user.batch = token.batch;
        session.user.dept = token.dept;
        session.user.candidateId = token.candidateId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    // signIn: "/auth/signin",
    signIn: "/login",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
