import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGovTender, createApplication } from "@/lib/db";
import { MapPin, Calendar, Building2, ArrowLeft, Share2, IndianRupee, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const GovernmentTenderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: tender, isLoading } = useQuery({
    queryKey: ["gov-tender", id],
    queryFn: () => fetchGovTender(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">Loading...</p></div>;

  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold">Tender not found</p>
        <button onClick={() => navigate("/government-tenders")} className="mt-4 text-sm text-primary hover:underline">
          ← Back to Government Tenders
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    if (tender.applyLink) {
      window.open(tender.applyLink, "_blank", "noopener,noreferrer");
      return;
    }

    setIsSubmitting(true);
    try {
      await createApplication({
        opportunityId: tender.id,
        opportunityTitle: tender.title,
        opportunityType: "gov-tender",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: tender.sector,
        budget: tender.budget,
        company: tender.department,
        location: tender.location,
        description: tender.description,
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["gov-tenders"] });
      setShowSuccessModal(true);
    } catch {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", { description: "Share this tender with others." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {tender.sector}
          </span>
          <div className="flex gap-2">
            {tender.verified && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-success px-2.5 py-1 rounded-full bg-success/10">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Share">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold">{tender.title}</h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" /> {tender.department}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tender.location}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{tender.deadline}</span>
          <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{tender.budget}</span>
        </div>

        <p className="text-sm text-muted-foreground mt-4">{tender.description}</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Tender Overview</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {tender.fullDescription || tender.description}
        </p>

        {tender.applyLink && (
          <p className="text-xs text-muted-foreground mb-4">
            Clicking Apply will redirect you to: <span className="text-primary">{tender.applyLink}</span>
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Submitting Application..." : tender.applyLink ? "Apply Now →" : "Apply Now"}
          </button>
          <button onClick={() => navigate("/government-tenders")} className="flex-1 h-10 rounded-lg border border-border font-semibold hover:bg-muted transition-colors">
            Back to Tenders
          </button>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Tender Application Submitted!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Your application for <span className="font-semibold text-foreground">"{tender.title}"</span> has been submitted to <span className="font-semibold text-foreground">{tender.department}</span>.
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
              onClick={() => navigate("/government-tenders")}
              className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Back to Tenders
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentTenderDetail;
