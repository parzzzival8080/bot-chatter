"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { cn } from "@/lib/utils";
import {
  MessageSquarePlus,
  MessageCircle,
  LayoutDashboard,
  Users,
  Settings,
} from "lucide-react";

export function Navbar() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();

  const isAdmin = currentUser?.role === "admin";
  const isAdminOrManager =
    currentUser?.role === "admin" || currentUser?.role === "manager";
  const canChat =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    currentUser?.role === "customer_service";

  const navLink = (href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        pathname === href
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="mr-2 flex items-center gap-2 text-lg font-bold tracking-tight sm:mr-4"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              BC
            </div>
            <span className="hidden sm:inline">Bot Chatter</span>
          </Link>
          {navLink("/", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}
          {isAdminOrManager &&
            navLink(
              "/compose",
              "Compose",
              <MessageSquarePlus className="h-4 w-4" />
            )}
          {canChat &&
            navLink("/chat", "Chat", <MessageCircle className="h-4 w-4" />)}
          {isAdmin &&
            navLink("/admin/users", "Users", <Users className="h-4 w-4" />)}
          {isAdmin &&
            navLink(
              "/admin/settings",
              "Settings",
              <Settings className="h-4 w-4" />
            )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {currentUser.name}
            </span>
          )}
          <NotificationBadge />
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
