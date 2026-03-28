"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquarePlus,
  MessageCircle,
  Users,
  Settings,
  UsersRound,
  UserCheck,
  ArrowLeftRight,
  Percent,
  Calculator,
  CalendarDays,
  PanelLeftClose,
  PanelLeft,
  Headphones,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavSection {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ReactNode;
    show: boolean;
  }[];
}

export function Sidebar() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isAdminOrManager =
    currentUser?.role === "admin" || currentUser?.role === "manager";
  const canChat =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    currentUser?.role === "customer_service";
  const canCRM =
    currentUser?.role === "admin" ||
    currentUser?.role === "customer_service";

  const sections: NavSection[] = [
    {
      label: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, show: true },
        { href: "/compose", label: "Compose", icon: <MessageSquarePlus className="h-4 w-4" />, show: isAdminOrManager },
        { href: "/chat", label: "Chat", icon: <MessageCircle className="h-4 w-4" />, show: isAdmin },
      ],
    },
    {
      label: "CRM",
      items: [
        { href: "/crm/livechat", label: "Live Chat", icon: <Headphones className="h-4 w-4" />, show: canCRM },
        { href: "/crm/team", label: "Team Members", icon: <UsersRound className="h-4 w-4" />, show: canCRM },
        { href: "/crm/customers", label: "Customers", icon: <UserCheck className="h-4 w-4" />, show: canCRM },
        { href: "/crm/transactions", label: "Transactions", icon: <ArrowLeftRight className="h-4 w-4" />, show: canCRM },
        { href: "/crm/calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" />, show: canCRM },
        { href: "/crm/commission", label: "Commission", icon: <Calculator className="h-4 w-4" />, show: canCRM },
        { href: "/crm/commission-config", label: "Commission Config", icon: <Percent className="h-4 w-4" />, show: canCRM },
      ],
    },
    {
      label: "Admin",
      items: [
        { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" />, show: isAdmin },
        { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" />, show: isAdmin },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              BC
            </div>
            <span>Bot Chatter</span>
          </Link>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter((i) => i.show);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className={cn("border-t p-3", collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-2")}>
        {!collapsed && currentUser && (
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {currentUser.name}
          </span>
        )}
        <NotificationBadge />
        <UserButton />
      </div>
    </aside>
  );
}
