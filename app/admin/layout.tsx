"use client";

import { Sidebar } from "@/components/sidebar";
import { LayoutDashboard, FileText, PlusCircle, Users, Shield } from "lucide-react";
import DashboardProvider from "../candidate/_components/pageComponents/DashboardProvider";

const data = {
  navMain: [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "LayoutDashboard",
    },
    {
      href: "/admin/create-interview",
      label: "Create Interview",
      icon: "PlusCircle",
    },
    {
      href: "/admin/interviews",
      label: "Interviews",
      icon: "FileText",
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: "Users",
    },
    {
      href: "/admin/admin-users",
      label: "Admin Users",
      icon: "Shield",
    },
  ],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <div className="flex min-h-screen relative overflow-hidden">
    //   {/* Background Gradients - Z Index 0 */}
    //   <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
    //     <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
    //     <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
    //   </div>

    //   <Sidebar links={adminLinks} title="Admin Panel" />
    //   <main className="flex-1 lg:pl-64 z-10 relative">
    //     <div className="container mx-auto p-6 lg:p-8">
    //       {children}
    //     </div>
    //   </main>
    // </div>

    <DashboardProvider links={data.navMain}>{children}</DashboardProvider>
  );
}
