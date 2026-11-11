import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { ChatWidget } from "@/components/shared/ChatWidget";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {/* UNIFY AI Assistant — floating chat widget */}
      <ChatWidget />
    </div>
  );
}
