"use client";

import * as React from "react";
import {
  BookOpen,
  MessageCircle,
  Code,
  Trophy,
  FolderOpen,
  Settings,
  User,
  SquareTerminal,
  Brain,
  Binoculars,
  FileCode,
  Sparkle,
  LayoutDashboard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
// import { NavMain } from "./NavMain";
import { motion } from "framer-motion";

import Image from "next/image";
import { NavMain } from "./NavMain";
import { usePathname } from "next/navigation";
// import Subscribepart from "./Subscribepart";

// Sidebar navigation data
// const data = {
//   navMain: [
//     {
//       title: "Dashboard",
//       url: "/candidate/dashboard",
//       icon: LayoutDashboard,

//       badge: null,
//     },
//     {
//       title: "Feedback Analysis",
//       url: "/candidate/feedbackanalysis",
//       icon: LayoutDashboard,

//       badge: "New",
//     },
//   ],
// };

export function AppSidebar({
  links,
  ...props
}: {
  links?: any;
} & React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const path = usePathname();

  const pathSlice = path.split("/")[1];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className={`
            group flex items-center gap-3 rounded-xl px-3 py-2
            transition-all duration-200 ease-in-out
            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
            data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground
            ${state === "collapsed" ? "justify-center px-0" : ""}
          `}
        >
          {state !== "collapsed" &&
            (pathSlice === "candidate" || pathSlice === "admin") && (
              <div className="flex flex-col text-left">
                <span className="truncate text-sm font-medium">
                  {pathSlice === "admin" ? "Admin" : "Candidate"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Your smart helper
                </span>
              </div>
            )}
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={links} />
      </SidebarContent>
      <SidebarRail ref={buttonRef} />
    </Sidebar>
  );
}
