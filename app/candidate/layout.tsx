"use client";

import { Sidebar } from "@/components/sidebar";
import { LayoutDashboard, Upload } from "lucide-react";
import { useContext } from "react";
import { InterviewContext } from "@/lib/contexts/InterviewContext";
import { Providers } from "./_components/pageComponents/Providers";
import DashboardProvider from "./_components/pageComponents/DashboardProvider";
import { AuthProvider } from "@/lib/contexts/auth-context";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/candidate/dashboard",
      icon: "LayoutDashboard",

      badge: null,
    },
    {
      title: "Feedback Analysis",
      url: "/candidate/feedbackanalysis",
      icon: "LayoutDashboard",

      badge: "New",
    },
    {
      title: "Final Analysis",
      url: "/candidate/finalanalysis",
      icon: "LayoutDashboard",

      badge: "New",
    },
  ],
};

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const interviewContext = useContext(InterviewContext);
  const isInterviewing = interviewContext?.isInterviewing;

  return (
    <AuthProvider>
      <DashboardProvider links={data.navMain}>
        {/* <div className="flex min-h-screen">
          {!isInterviewing && (
            <Sidebar links={candidateLinks} title="Candidate Portal" />
          )}
          <main className={`flex-1 ${!isInterviewing ? "lg:pl-64" : ""}`}>
            <div
              className={`container mx-auto ${
                !isInterviewing ? "p-6 lg:p-8" : "p-0"
              }`}
            >
              {children}
            </div>
          </main>
        </div> */}
        {children}
      </DashboardProvider>
    </AuthProvider>
  );
}
