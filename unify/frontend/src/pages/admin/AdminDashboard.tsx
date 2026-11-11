import { useQuery } from "@tanstack/react-query";
import { fetchGovContracts, fetchGovTenders } from "@/lib/db";
import { LayoutDashboard, FileText, Landmark, ShieldCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: contracts = [] } = useQuery({ queryKey: ["gov-contracts"], queryFn: fetchGovContracts });
  const { data: tenders = [] } = useQuery({ queryKey: ["gov-tenders"], queryFn: fetchGovTenders });

  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const activeTenders = tenders.filter((t) => t.status === "active").length;

  const stats = [
    { label: "Total Contracts", value: contracts.length, sub: `${activeContracts} active`, icon: FileText, path: "/admin/contracts" },
    { label: "Total Tenders", value: tenders.length, sub: `${activeTenders} active`, icon: Landmark, path: "/admin/tenders" },
    { label: "Verified Listings", value: contracts.filter((c) => c.verified).length + tenders.filter((t) => t.verified).length, sub: "across contracts & tenders", icon: ShieldCheck, path: "/admin/contracts" },
    { label: "Total Listings", value: contracts.length + tenders.length, sub: "contracts + tenders", icon: TrendingUp, path: "/admin/contracts" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" /> Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage government contracts and tenders posted on UNIFY.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => navigate(s.path)} className="glass-card rounded-xl p-4 text-left hover:scale-[1.02] transition-transform">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Recent Contracts</h2>
          <div className="space-y-2">
            {contracts.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="truncate max-w-[200px]">{c.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/admin/contracts")} className="mt-3 text-xs text-primary hover:underline">Manage contracts →</button>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Recent Tenders</h2>
          <div className="space-y-2">
            {tenders.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="truncate max-w-[200px]">{t.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/admin/tenders")} className="mt-3 text-xs text-primary hover:underline">Manage tenders →</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
