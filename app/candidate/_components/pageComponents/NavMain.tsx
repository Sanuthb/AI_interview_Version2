"use client";

// import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";

export function NavMain({ items }: { items: any }) {
  const { state } = useSidebar();
  const path = usePathname();
  const { theme } = useTheme();

  // Helper function to get icon component from string name
  const getIcon = (icon: any) => {
    if (typeof icon === "string") {
      const IconComponent = (Icons as any)[icon];
      return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
    }
    if (typeof icon === "function") {
      const IconComponent = icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item: any, index: number) => {
          const itemUrl = item.url || item.href;
          const isActive =
            path === itemUrl ||
            (path.startsWith(`${itemUrl}/`) && itemUrl !== "/admin");
          const key = item.title || item.label || itemUrl || index;

          if (!itemUrl) {
            console.warn("Navigation item missing URL:", item);
            return null;
          }

          return (
            <SidebarMenuItem key={key} className="group/menu-item relative">
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                className={`z-30 h-12 w-full px-3 flex items-center gap-2 transition-all
                  ${state === "collapsed" ? "my-1.5" : ""}
                  
                  ${
                    isActive
                      ? `font-semibold bg-[#2a44cb] text-white dark:bg-sidebar-accent dark:text-sidebar-accent-foreground hover:bg-[#2a44cb] hover:text-white  ${
                          theme === "light"
                            ? "hover:bg-[#2a44cb] hover:text-white"
                            : ""
                        }  `
                      : "text-foreground hover:bg-[#2a44cb] hover:text-white dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground"
                  }`}
              >
                <Link
                  href={itemUrl}
                  aria-current={isActive ? "page" : undefined}
                  className="flex items-center gap-2 w-full px-3"
                >
                  {getIcon(item.icon)}
                  {state !== "collapsed" && (
                    <span>{item.title || item.label}</span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
