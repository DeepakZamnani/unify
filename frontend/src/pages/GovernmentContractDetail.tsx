import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGovContract,
  createApplication,
  fetchApplications,
  ApiError,
} from "@/lib/db";
import {
  MapPin,
  Calendar,
  Building2,
  ArrowLeft,
  Share2,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const GovernmentContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["gov-contract", id],
    queryFn: () => fetchGovContract(id!),
    enabled: !!id,
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const alreadyApplied = myApplications.some(
    (a) =>
      (a.opportunityId === id ||
        a.opportunityTitle === contract?.title) &&
      a.status !== "withdrawn"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold">Contract not found</p>

        <button
          onClick={() => navigate("/government-contracts")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          ← Back to Government Contracts
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    if (contract.applyLink) {
      window.open(contract.applyLink, "_blank", "noopener,noreferrer");
      return;
    }

    setIsSubmitting(true);

    try {
      await createApplication({
        opportunityId: contract.id,
        opportunityTitle: contract.title,
        opportunityType: "gov-contract",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: contract.sector,
        budget: contract.budget,
        company: contract.department,
        location: contract.location,
        description: contract.description,
      });

      queryClient.invalidateQueries({
        queryKey: ["applications"],
      });

      queryClient.invalidateQueries({
        queryKey: ["gov-contracts"],
      });

      setShowSuccessModal(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit application. Please try again.";

      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);

    toast.success("Link copied!", {
      description: "Share this contract with others.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Contract Header */}
      <div className="glass-card rounded-xl p-6">

        <div className="flex items-start justify-between mb-4">

          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {contract.sector}
          </span>

          <div className="flex gap-2">

            {contract.verified && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-success px-2.5 py-1 rounded-full bg-success/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>

          </div>

        </div>

        <h1 className="text-3xl font-bold">
          {contract.title}
        </h1>

        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {contract.department}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">

          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {contract.location}
          </span>

          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {contract.deadline}
          </span>

          <span className="flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" />
            {contract.budget}
          </span>

        </div>

        <p className="text-sm text-muted-foreground mt-4">
          {contract.description}
        </p>

      </div>

      {/* Project Overview */}
      <div className="glass-card rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-4">
          Project Overview
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {contract.fullDescription || contract.description}
        </p>

        {contract.applyLink && (
          <p className="text-xs text-muted-foreground mb-4">
            Clicking Apply will redirect you to:
            <span className="text-primary ml-1">
              {contract.applyLink}
            </span>
          </p>
        )}

        {/* Application Buttons */}
        <div className="flex gap-3 mt-4">

          {alreadyApplied ? (
            <div className="flex-1 h-10 rounded-lg bg-success/10 text-success font-semibold flex items-center justify-center gap-2 border border-success/20 cursor-default text-sm">
              <BadgeCheck className="h-4 w-4" />
              Application Already Submitted
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting
                ? "Submitting Application..."
                : contract.applyLink
                ? "Apply Now →"
                : "Apply Now"}
            </button>
          )}

          <button
            onClick={() => navigate("/government-contracts")}
            className="flex-1 h-10 rounded-lg border border-border font-semibold hover:bg-muted transition-colors"
          >
            Back to Contracts
          </button>

        </div>

      </div>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      >

        <DialogContent className="sm:max-w-md text-center">

          <DialogHeader className="flex flex-col items-center justify-center text-center">

            <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <DialogTitle className="text-xl font-bold">
              Application Submitted Successfully!
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Your application for{" "}
              <span className="font-semibold text-foreground">
                "{contract.title}"
              </span>{" "}
              has been submitted to{" "}
              <span className="font-semibold text-foreground">
                {contract.department}
              </span>.
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
              onClick={() => navigate("/government-contracts")}
              className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Back to Contracts
            </button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
};

export default GovernmentContractDetail;