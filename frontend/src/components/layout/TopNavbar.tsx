import { Search, Bell, MessageSquare, ChevronDown, LogOut, Command as CommandIcon, Sparkles, Landmark, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { fetchConversations, fetchGovContracts, fetchGovTenders, fetchOpportunities, type Conversation, type GovContract, type GovTender } from "@/lib/db";
import type { Opportunity } from "@/data/dummy";

interface CommandEntry {
  id: string;
  title: string;
  description: string;
  meta: string;
  href: string;
  group: string;
  icon: typeof Search;
}

export function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [govContracts, setGovContracts] = useState<GovContract[]>([]);
  const [govTenders, setGovTenders] = useState<GovTender[]>([]);
  const [contacts, setContacts] = useState<Conversation[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetchOpportunities(),
      fetchGovContracts(),
      fetchGovTenders(),
      fetchConversations(),
    ]).then(([loadedOpportunities, loadedContracts, loadedTenders, loadedContacts]) => {
      if (!active) return;
      setOpportunities(loadedOpportunities);
      setGovContracts(loadedContracts);
      setGovTenders(loadedTenders);
      setContacts(loadedContacts);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const commandEntries = useMemo<CommandEntry[]>(() => {
    const activeContracts = govContracts.filter((contract) => contract.status === "active");
    const activeTenders = govTenders.filter((tender) => tender.status === "active");

    return [
      { id: "quick-dashboard", title: "Open dashboard", description: "Jump to the main dashboard overview.", meta: "Home", href: "/", group: "Quick actions", icon: Sparkles },
      { id: "quick-opportunities", title: "Open opportunities", description: "Browse live opportunities and filters.", meta: "Marketplace", href: "/opportunities", group: "Quick actions", icon: Search },
      { id: "quick-contracts", title: "Open government contracts", description: "Review active verified contracts.", meta: "Contracts", href: "/government-contracts", group: "Quick actions", icon: Landmark },
      { id: "quick-tenders", title: "Open government tenders", description: "Scan available ministry tenders.", meta: "Tenders", href: "/government-tenders", group: "Quick actions", icon: FileText },
      { id: "quick-messages", title: "Open messages", description: "Continue active partner conversations.", meta: "Contacts", href: "/messages", group: "Quick actions", icon: Users },
      ...opportunities.slice(0, 6).map((opportunity) => ({ id: `opportunity-${opportunity.id}`, title: opportunity.title, description: opportunity.sector, meta: `${opportunity.location} · ${opportunity.budgetRange} · ${opportunity.matchScore}% match`, href: `/opportunities/${opportunity.id}`, group: "Opportunities", icon: Search })),
      ...activeTenders.slice(0, 4).map((tender) => ({ id: `tender-${tender.id}`, title: tender.title, description: tender.department, meta: `${tender.sector} · ${tender.location} · ${tender.budget}`, href: `/government-tenders/${tender.id}`, group: "Government tenders", icon: FileText })),
      ...activeContracts.slice(0, 4).map((contract) => ({ id: `contract-${contract.id}`, title: contract.title, description: contract.department, meta: `${contract.sector} · ${contract.location} · ${contract.budget}`, href: `/government-contracts/${contract.id}`, group: "Active contracts", icon: Landmark })),
      ...contacts.slice(0, 4).map((contact) => ({ id: `contact-${contact.id}`, title: contact.name, description: contact.company, meta: `${contact.lastMessage} · ${contact.unread > 0 ? `${contact.unread} unread` : "Read"}`, href: "/messages", group: "Contacts", icon: Users })),
    ];
  }, [contacts, govContracts, govTenders, opportunities]);

  const handleCommandSelect = (href: string) => {
    setCommandOpen(false);
    navigate(href);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const initials = user?.company ? user.company.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() : "C7";

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="group flex h-11 w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 text-left text-sm text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
          >
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="flex-1 truncate">Search tenders, contacts, and active contracts...</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <CommandIcon className="h-3 w-3" /> Ctrl K
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/messages")} className="relative rounded-xl p-2.5 hover:bg-muted/70 transition-colors">
            <MessageSquare className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.8)]" />
          </button>
          <button onClick={() => navigate("/notifications")} className="relative rounded-xl p-2.5 hover:bg-muted/70 transition-colors">
            <Bell className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive shadow-[0_0_14px_hsl(var(--destructive)/0.75)]" />
          </button>
          <div className="w-px h-8 bg-border mx-2" />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 rounded-2xl border border-transparent px-2 pr-3 py-1.5 hover:border-border/60 hover:bg-muted/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-primary-foreground">{initials}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.company || "C-78 PVT LTD"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">MSME Account</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/70 bg-background/95 p-1 shadow-2xl backdrop-blur-xl animate-fade-in z-[100]">
                <button onClick={() => { navigate("/profile"); setShowDropdown(false); }} className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-muted/70 transition-colors">Profile</button>
                <button onClick={() => { navigate("/settings"); setShowDropdown(false); }} className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-muted/70 transition-colors">Settings</button>
                <button onClick={() => { navigate("/subscriptions"); setShowDropdown(false); }} className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-muted/70 transition-colors">Subscription</button>
                <button onClick={() => { navigate("/applications"); setShowDropdown(false); }} className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-muted/70 transition-colors">My Applications</button>
                <div className="my-1 border-t border-border/70" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm text-destructive hover:bg-muted/70 transition-colors">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search tenders, contacts, and active contracts..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick actions">
            {commandEntries.filter((entry) => entry.group === "Quick actions").map((entry) => (
              <CommandItem key={entry.id} value={`${entry.title} ${entry.description} ${entry.meta}`} onSelect={() => handleCommandSelect(entry.href)}>
                <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <CommandShortcut>{entry.meta}</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Opportunities">
            {commandEntries.filter((entry) => entry.group === "Opportunities").map((entry) => (
              <CommandItem key={entry.id} value={`${entry.title} ${entry.description} ${entry.meta}`} onSelect={() => handleCommandSelect(entry.href)}>
                <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <CommandShortcut className="text-[10px]">{entry.meta}</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Government tenders">
            {commandEntries.filter((entry) => entry.group === "Government tenders").map((entry) => (
              <CommandItem key={entry.id} value={`${entry.title} ${entry.description} ${entry.meta}`} onSelect={() => handleCommandSelect(entry.href)}>
                <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <CommandShortcut className="text-[10px]">{entry.meta}</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Active contracts">
            {commandEntries.filter((entry) => entry.group === "Active contracts").map((entry) => (
              <CommandItem key={entry.id} value={`${entry.title} ${entry.description} ${entry.meta}`} onSelect={() => handleCommandSelect(entry.href)}>
                <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <CommandShortcut className="text-[10px]">{entry.meta}</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Contacts">
            {commandEntries.filter((entry) => entry.group === "Contacts").map((entry) => (
              <CommandItem key={entry.id} value={`${entry.title} ${entry.description} ${entry.meta}`} onSelect={() => handleCommandSelect(entry.href)}>
                <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <CommandShortcut className="text-[10px]">{entry.meta}</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}