import { useQuery } from "@tanstack/react-query";
import { fetchGovTenders, fetchApplications } from "@/lib/db";
import { Landmark, MapPin, Calendar, IndianRupee, ExternalLink, ShieldCheck, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const GovernmentTenders = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const { data: applications = [] } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const { data: tenders = [] } = useQuery({ queryKey: ["gov-tenders"], queryFn: fetchGovTenders });

  const appliedSet = new Set(applications.map((a) => a.opportunityId || a.opportunityTitle));
  const activeTenders = tenders.filter(
    (t) => t.status === "active" && !appliedSet.has(t.id) && !appliedSet.has(t.title)
  );
  const sectors = Array.from(new Set(activeTenders.map((t) => t.sector))).sort();

  const filtered = activeTenders.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.department.toLowerCase().includes(q);
    const matchesSector = !selectedSector || t.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const handleApply = (id: string, applyLink?: string) => {
    if (applyLink) {
      window.open(applyLink, "_blank", "noopener,noreferrer");
    } else {
      navigate(`/government-tenders/${id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Government Tenders
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Discover government tenders from various ministries and departments.</p>
      </div>

      <div className="space-y-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, ministry, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSector(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedSector === null ? "gradient-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
          >
            All ({activeTenders.length})
          </button>
          {sectors.map((s) => (
            <button key={s} onClick={() => setSelectedSector(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedSector === s ? "gradient-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
            >
              {s} ({activeTenders.filter((t) => t.sector === s).length})
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Showing {filtered.length} tender{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No tenders found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tender) => (
            <div key={tender.id} className="glass-card-hover rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">{tender.sector}</span>
                {tender.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold mt-2">{tender.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Landmark className="h-3 w-3" /> {tender.department}
              </p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tender.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tender.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{tender.deadline}</span>
              </div>
              <p className="text-sm font-bold mt-3 flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{tender.budget.replace("₹", "")}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleApply(tender.id, tender.applyLink)}
                  className="flex-1 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                >
                  Apply Now
                </button>
                <button
                  onClick={() => navigate(`/government-tenders/${tender.id}`)}
                  className="flex-1 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentTenders;
