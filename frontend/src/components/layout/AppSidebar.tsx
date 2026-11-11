import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, Link2, Brain, TrendingUp, Shield, MessageSquare, Bell, User, Settings, ChevronLeft, ChevronRight, Boxes, Landmark, ShieldCheck, Crown, LayoutGrid, Cpu, Inbox
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Opportunities", path: "/opportunities", icon: Search },
  { title: "My Applications", path: "/applications", icon: FileText },
  { title: "Gov Tenders", path: "/government-tenders", icon: Landmark },
  { title: "Gov Contracts", path: "/government-contracts", icon: ShieldCheck },
  { title: "Supply Chain", path: "/supply-chain", icon: Boxes },
  { title: "Collaborations", path: "/collaborations", icon: Link2 },
  { title: "AI Recommendations", path: "/ai-recommendations", icon: Brain },
  { title: "COMS Matching", path: "/coms-matching", icon: Cpu },
  { title: "Growth Analytics", path: "/company-growth", icon: TrendingUp },
  { title: "Mediation", path: "/mediation", icon: Shield },
];

const adminItems = [
  { title: "Admin Dashboard", path: "/admin", icon: LayoutGrid },
  { title: "Manage Contracts", path: "/admin/contracts", icon: FileText },
  { title: "Manage Tenders", path: "/admin/tenders", icon: Landmark },
];

const bottomItems = [
  { title: "Messages", path: "/messages", icon: MessageSquare },
  { title: "Notifications", path: "/notifications", icon: Bell },
  { title: "Requests", path: "/requests", icon: Inbox },
  { title: "Subscriptions", path: "/subscriptions", icon: Crown },
  { title: "Profile", path: "/profile", icon: User },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  const linkBase = `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden ${collapsed ? "justify-center" : ""}`;
  const activeLink = "bg-primary/10 text-primary border-r-2 border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]";
  const inactiveLink = "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";

  const renderLink = (
    item: (typeof navItems)[number] | (typeof adminItems)[number] | (typeof bottomItems)[number],
    isActive: boolean,
  ) => {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`${linkBase} ${isActive ? activeLink : inactiveLink}`}
      >
        <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
        {!collapsed && <span className="truncate">{item.title}</span>}
        {isActive && !collapsed && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.7)]" />
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={`${collapsed ? "w-[74px]" : "w-[272px]"}
        sticky top-0 h-screen sidebar-gradient border-r border-sidebar-border flex flex-col transition-[width] duration-300 ease-in-out flex-shrink-0 z-40 overflow-hidden`}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-sidebar-primary-foreground">U</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight animate-fade-in">
              UNIFY
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted px-3 mb-2">
            Platform
          </p>
        )}
        {navItems.map((item) => {
          const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return renderLink(item, isActive);
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted px-3 mt-4 mb-2">
                Admin
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-sidebar-border" />}
            {adminItems.map((item) => {
              const isActive = item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path);
              return renderLink(item, isActive);
            })}
          </>
        )}
      </nav>

      <div className="py-3 px-2 space-y-1 border-t border-sidebar-border">
        {!collapsed && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted px-3 mb-2">
            Account
          </p>
        )}
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return renderLink(item, isActive);
        })}
      </div>

      <div className="px-2 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
