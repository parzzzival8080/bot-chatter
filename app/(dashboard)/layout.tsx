import RoleGuard from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { LiveChatNotifier } from "@/components/notifications/LiveChatNotifier";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <LiveChatNotifier />
    </RoleGuard>
  );
}
