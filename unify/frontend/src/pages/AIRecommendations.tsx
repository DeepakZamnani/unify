import { useQuery } from "@tanstack/react-query";
import { fetchOpportunities, fetchApplications } from "@/lib/db";
import { Brain, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

const reasons = [
  "Strong experience in IT infrastructure projects",
  "Your company's expertise in agricultural technology aligns perfectly",
  "Past project history shows capability in energy sector",
  "Your team's data analytics skills match this requirement",
  "Geographic proximity and relevant certifications",
  "Strong financial inclusion project experience",
];

const AIRecommendations = () => {
  const navigate = useNavigate();

  const { data: applications = [] } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const { data: opportunities = [] } = useQuery({ queryKey: ["opportunities"], queryFn: fetchOpportunities });

  const appliedSet = new Set(applications.map((a) => a.opportunityId || a.opportunityTitle));
  const available = opportunities.filter((o) => !appliedSet.has(o.id) && !appliedSet.has(o.title));
  const sorted = [...available].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Recommendations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalized opportunities based on your Capability–Opportunity Matching Score (COMS).
        </p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent"><Lightbulb className="h-4 w-4 text-accent-foreground" /></div>
          <div>
            <p className="text-sm font-medium">AI Insight</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on your profile, you have the strongest match in IT & Infrastructure and FinTech sectors. We found {sorted.length} high-confidence opportunities available.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((opp, i) => (
          <div key={opp.id} className="glass-card-hover rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${opp.matchScore >= 80 ? "text-success" : opp.matchScore >= 60 ? "text-warning" : "text-destructive"}`}>
                    {opp.matchScore}% Match
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{opp.type}</span>
                </div>
                <h3 className="text-sm font-semibold">{opp.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{opp.postedBy} · {opp.location} · {opp.budgetRange}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Brain className="h-3 w-3 text-primary" />
                  Recommended because: {reasons[i % reasons.length]}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/opportunities/${opp.id}`)} className="h-8 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Apply</button>
                <button onClick={() => navigate(`/opportunities/${opp.id}`)} className="h-8 px-4 rounded-lg border border-border text-xs font-medium hover:bg-muted">Details</button>
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-16 glass-card rounded-xl">
            <p className="text-sm text-muted-foreground">All recommended opportunities have been applied for!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
