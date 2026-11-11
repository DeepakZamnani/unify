import { Search, Bell, MessageSquare, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/opportunities?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const initials = user?.company ? user.company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "C7";

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0 relative z-50">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search opportunities, supply chain requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/messages")} className="relative p-2.5 rounded-lg hover:bg-muted transition-colors">
          <MessageSquare className="h-[18px] w-[18px] text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <button onClick={() => navigate("/notifications")} className="relative p-2.5 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </button>
        <div className="w-px h-8 bg-border mx-2" />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.company || "C-78 PVT LTD"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">MSME Account</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-card border border-border shadow-xl py-1 z-[100] animate-fade-in">
              <button onClick={() => { navigate("/profile"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors">Profile</button>
              <button onClick={() => { navigate("/settings"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors">Settings</button>
              <button onClick={() => { navigate("/subscriptions"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors">Subscription</button>
              <button onClick={() => { navigate("/applications"); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors">My Applications</button>
              <div className="border-t border-border my-1" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
