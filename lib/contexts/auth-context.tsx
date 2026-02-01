"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    usn: string,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  candidateId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    // console.log("NextAuth session changed:", { session, status });

    if (session?.user?.candidateId) {
      setCandidateId(session.user.candidateId);
      // console.log(
      //   "Candidate ID set from NextAuth session:",
      //   session.user.candidateId,
      // );
    } else {
      setCandidateId(null);
      // console.log("No candidate ID in NextAuth session");
    }
  }, [session]);

  const signIn = async (email: string, password: string) => {
    // This should be handled by NextAuth signIn
    return { error: "Use NextAuth signIn instead" };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    usn: string,
  ) => {
    // This should be handled by admin user creation
    return { error: "Contact administrator for account creation" };
  };

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      // Force a client-side redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        loading: status === "loading",
        signIn,
        signUp,
        signOut,
        candidateId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
