import { MapPin, Calendar, Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Opportunity } from "@/data/dummy";
import { MatchScoreBar } from "./MatchScoreBar";
import { useState } from "react";
import { toast } from "sonner";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onToggleSave?: () => void;
}

export function OpportunityCard({ opportunity, onToggleSave }: OpportunityCardProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(opportunity.saved ?? false);

  const typeColors: Record<string, string> = {
    tender: "bg-primary/10 text-primary",
    contract: "bg-secondary/10 text-secondary",
    outsourcing: "bg-warning/10 text-warning",
    collaboration: "bg-success/10 text-success",
  };

  const handleSave = () => {
    setSaved(!saved);
    onToggleSave?.();
    toast(saved ? "Removed from saved" : "Opportunity saved!");
  };

  const handleApply = () => {
    toast.success("Application submitted!", {
      description: `You applied for "${opportunity.title}". Track it in My Applications.`,
    });
  };

  return (
    <div className="glass-card-hover group relative flex flex-col rounded-xl border border-border/60 bg-card/70 p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeColors[opportunity.type]}`}>
          {opportunity.type}
        </span>
        <button onClick={handleSave} className="rounded-md p-1.5 hover:bg-muted/80 transition-colors">
          {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <h3 className="font-semibold text-sm leading-snug mb-1">{opportunity.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{opportunity.postedBy}</p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opportunity.location}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{opportunity.deadline}</span>
      </div>

      <div className="flex items-center justify-between text-xs mb-4">
        <span className="font-medium text-foreground">{opportunity.budgetRange}</span>
        <span className="text-muted-foreground">{opportunity.sector}</span>
      </div>

      <MatchScoreBar score={opportunity.matchScore} />

      <div className="flex gap-2 mt-4">
        <button onClick={handleApply} className="flex-1 h-9 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
          Apply
        </button>
        <button onClick={() => navigate(`/opportunities/${opportunity.id}`)} className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}
