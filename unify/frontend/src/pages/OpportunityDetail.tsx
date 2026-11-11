import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Building2, ArrowLeft, Bookmark, BookmarkCheck, Share2, FileText, Clock, CheckCircle2, BadgeCheck } from "lucide-react";
import { MatchScoreBar } from "@/components/shared/MatchScoreBar";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOpportunity, toggleSaveOpportunity, createApplication, fetchApplications, ApiError } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => fetchOpportunity(id!),
    enabled: !!id,
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const alreadyApplied = myApplications.some(
    (a) => (a.opportunityId === id || a.opportunityTitle === opportunity?.title) && a.status !== "withdrawn"
  );

  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>;
  }

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold">Opportunity not found</p>
        <button onClick={() => navigate("/opportunities")} className="mt-4 text-sm text-primary hover:underline">
          ← Back to Opportunities
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      await createApplication({
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        opportunityType: opportunity.type || "opportunity",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: opportunity.sector,
        budget: opportunity.budgetRange,
        company: opportunity.postedBy,
        location: opportunity.location,
        description: opportunity.description,
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit application. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    await toggleSaveOpportunity(opportunity.id, next);
    toast(next ? "Opportunity saved!" : "Removed from saved", {
      description: next ? "You can find it in your saved opportunities." : "Removed from your bookmarks.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", { description: "Share this opportunity with others." });
  };

  const typeColors: Record<string, string> = {
    tender: "bg-primary/10 text-primary",
    contract: "bg-secondary/10 text-secondary",
    outsourcing: "bg-warning/10 text-warning",
    collaboration: "bg-success/10 text-success",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeColors[opportunity.type]}`}>
            {opportunity.type}
          </span>
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 rounded-lg hover:bg-muted transition-colors" title={saved ? "Unsave" : "Save"}>
              {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Share">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <h1 className="text-xl font-bold">{opportunity.title}</h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" /> {opportunity.postedBy}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opportunity.location}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{opportunity.deadline}</span>
          <span className="font-medium text-foreground">{opportunity.budgetRange}</span>
        </div>

        <div className="mt-5">
          <MatchScoreBar score={opportunity.matchScore} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-3">Description</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{opportunity.description}</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-3">Requirements</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />Minimum 3 years experience in {opportunity.sector}</li>
          <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />Valid business registration and tax clearance</li>
          <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />Relevant ISO or industry certifications preferred</li>
          <li className="flex items-start gap-2"><FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />Capacity to deliver within budget range of {opportunity.budgetRange}</li>
        </ul>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-3">Submission Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Deadline</p>
            <p className="font-medium flex items-center gap-1 mt-0.5"><Clock className="h-3.5 w-3.5 text-warning" />{opportunity.deadline}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sector</p>
            <p className="font-medium mt-0.5">{opportunity.sector}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Budget Range</p>
            <p className="font-medium mt-0.5">{opportunity.budgetRange}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize mt-0.5">{opportunity.type}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {alreadyApplied ? (
          <div className="flex-1 h-11 rounded-lg bg-success/10 text-success text-sm font-semibold flex items-center justify-center gap-2 border border-success/20 cursor-default">
            <BadgeCheck className="h-4 w-4" />
            Application Already Submitted
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
          >
            {isSubmitting ? "Submitting Application..." : "Apply for Opportunity"}
          </button>
        )}
        <button onClick={handleSave} className="h-11 px-6 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
          {saved ? "Saved ✓" : "Save"}
        </button>
        <button onClick={handleShare} className="h-11 px-6 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
          Share
        </button>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Application Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Your application for <span className="font-semibold text-foreground">"{opportunity.title}"</span> has been saved and submitted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={() => navigate("/applications")}
              className="flex-1 h-10 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Track in My Applications
            </button>
            <button
              onClick={() => navigate("/opportunities")}
              className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Back to Opportunities
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpportunityDetail;
