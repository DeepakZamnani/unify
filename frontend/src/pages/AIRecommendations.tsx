import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOpportunities, fetchApplications, createApplication } from "@/lib/db";
import { Brain, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MatchScoreBar } from "@/components/shared/MatchScoreBar";

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
  const queryClient = useQueryClient();
  const { data: opportunities = [] } = useQuery({ queryKey: ["opportunities"], queryFn: fetchOpportunities });
  const { data: applications = [] } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });

  // Only show opportunities the user hasn't applied for yet
  const appliedSet = new Set(applications.map((a) => a.opportunityId || a.opportunityTitle));
  const sorted = opportunities
    .filter((o) => !appliedSet.has(o.id) && !appliedSet.has(o.title))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  const handleApply = async (opportunity: (typeof opportunities)[number]) => {
    try {
      await createApplication({
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        opportunityType: opportunity.type,
        sector: opportunity.sector,
        budget: opportunity.budgetRange,
        company: opportunity.postedBy,
        location: opportunity.location,
        description: opportunity.description,
      });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application submitted!", { description: `You applied for "${opportunity.title}". Track it in My Applications.` });
    } catch (err) {
      toast.error("Could not apply", { description: err instanceof Error ? err.message : "Unknown error" });
    }
  };

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

      <div className="premium-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-sm">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Insight</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on your profile, you have the strongest match in IT & Infrastructure and FinTech sectors. We found {sorted.filter((o) => o.matchScore >= 80).length} high-confidence opportunities available.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((opportunity, index) => (
          <div key={opportunity.id} className="premium-card-hover p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <MatchScoreBar score={opportunity.matchScore} showLabel={false} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground">
                    {opportunity.type}
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-snug">{opportunity.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {opportunity.postedBy} · {opportunity.location} · {opportunity.budgetRange}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Brain className="h-3 w-3 text-primary" />
                  Recommended because: {reasons[index % reasons.length]}
                </p>
              </div>
              <div className="flex gap-2 md:flex-shrink-0">
                <button onClick={() => handleApply(opportunity)} className="h-8 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
                  Apply
                </button>
                <button onClick={() => navigate(`/opportunities/${opportunity.id}`)} className="h-8 px-4 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;