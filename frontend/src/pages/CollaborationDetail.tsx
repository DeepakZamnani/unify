import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCollaboration, createApplication, fetchApplications, ApiError } from "@/lib/db";
import { ArrowLeft, Users, IndianRupee, Share2, CheckCircle2, Building2, Check, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CollaborationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: collaboration, isLoading } = useQuery({
    queryKey: ["collaboration", id],
    queryFn: () => fetchCollaboration(id!),
    enabled: !!id,
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const alreadyApplied = myApplications.some(
    (a) => (a.opportunityId === id || a.opportunityTitle === collaboration?.projectTitle) && a.status !== "withdrawn"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground animate-pulse">Loading collaboration details...</p>
      </div>
    );
  }

  if (!collaboration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Collaboration not found</h1>
        <button onClick={() => navigate("/collaborations")} className="mt-4 h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
          Back to Collaborations
        </button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Copied to clipboard!");
  };

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    try {
      await createApplication({
        opportunityId: collaboration.id,
        opportunityTitle: collaboration.projectTitle,
        opportunityType: "collaboration",
        ownerId: collaboration.createdBy || "",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: collaboration.sector,
        budget: collaboration.budget,
        company: collaboration.companyName,
        location: "Pan India",
        description: collaboration.description,
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["collaborations"] });
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit request. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate("/collaborations")}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Collaborations
      </button>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{collaboration.projectTitle}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {collaboration.companyName}
              </p>
            </div>
            <button
              onClick={handleShare}
              className="h-9 w-9 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary/10 text-secondary inline-block w-fit">{collaboration.sector}</span>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Budget</p>
              <p className="text-xl font-bold text-primary flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                {collaboration.budget.replace("₹", "")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Partners Needed</p>
              <p className="text-lg font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {collaboration.partnersNeeded} partners
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-3">Project Overview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{collaboration.fullDescription}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {collaboration.requiredSkills.map((skill) => (
                <span key={skill} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {alreadyApplied ? (
            <div className="flex-1 h-11 rounded-lg bg-success/10 text-success text-sm font-semibold flex items-center justify-center gap-2 border border-success/20">
              <BadgeCheck className="h-4 w-4" />
              Request Already Submitted
            </div>
          ) : (
            <button
              onClick={handleSendRequest}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-lg gradient-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Submitting Request..." : "Send Request"}
            </button>
          )}
          <button
            onClick={() => navigate("/collaborations")}
            className="flex-1 h-11 rounded-lg border-2 border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Request Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Your request to collaborate on <span className="font-semibold text-foreground">"{collaboration.projectTitle}"</span> has been saved and sent to <span className="font-semibold text-foreground">{collaboration.companyName}</span>.
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
              onClick={() => navigate("/collaborations")}
              className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Back to Collaborations
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaborationDetail;