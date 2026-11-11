import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReceivedRequests, updateApplicationStatus, ApiError } from "@/lib/db";
import { Clock, CheckCircle, XCircle, Inbox, Building2, IndianRupee, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Application } from "@/data/dummy";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  accepted: { color: "text-success", bg: "bg-success/10", label: "Accepted" },
  rejected: { color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
  withdrawn: { color: "text-muted-foreground", bg: "bg-muted/30", label: "Withdrawn" },
};

const typeLabel: Record<string, string> = {
  collaboration: "Collaboration",
  "supply-chain": "Supply Chain",
  requirement: "Requirement",
  tender: "Tender",
  contract: "Contract",
  opportunity: "Opportunity",
};

const Requests = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<"accepted" | "rejected" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["received-requests"],
    queryFn: fetchReceivedRequests,
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Application ${status === "accepted" ? "accepted" : "rejected"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["received-requests"] });
      setConfirmOpen(false);
      setSelectedRequest(null);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to update status. Try again.";
      toast.error(msg);
    },
  });

  const openConfirm = (req: Application, type: "accepted" | "rejected") => {
    setSelectedRequest(req);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedRequest || !actionType) return;
    updateStatus({ id: selectedRequest.id, status: actionType });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground animate-pulse">Loading incoming requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Incoming applications for opportunities you have posted.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-20 gap-4">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No incoming requests yet.</p>
          <p className="text-muted-foreground/60 text-xs">
            When someone applies to your posted opportunities, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const sc = statusConfig[req.status] ?? statusConfig.pending;
            const isPending = req.status === "pending";
            return (
              <div
                key={req.id}
                className="glass-card rounded-xl p-5 space-y-4 hover:ring-1 hover:ring-primary/20 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold">{req.opportunityTitle}</h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {typeLabel[req.opportunityType ?? "opportunity"] ?? req.opportunityType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.sector}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${sc.bg} ${sc.color} whitespace-nowrap`}>
                    {sc.label}
                  </span>
                </div>

                {/* Applicant Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {req.applicantName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground">{req.applicantName}</span>
                    </div>
                  )}
                  {req.applicantCompany && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{req.applicantCompany}</span>
                    </div>
                  )}
                  {req.budget && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                      <span>{req.budget}</span>
                    </div>
                  )}
                </div>

                {/* Applicant message */}
                {req.message && (
                  <div className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg p-3">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-relaxed">{req.message}</p>
                  </div>
                )}

                {/* Applied date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Applied: {req.appliedDate ? new Date(req.appliedDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </div>

                {/* Action buttons — only for pending */}
                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openConfirm(req, "accepted")}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => openConfirm(req, "rejected")}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "accepted" ? "Accept Application?" : "Reject Application?"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accepted"
                ? `You are about to accept the application from ${selectedRequest?.applicantName ?? "this applicant"} for "${selectedRequest?.opportunityTitle}". They will be notified immediately.`
                : `You are about to reject the application from ${selectedRequest?.applicantName ?? "this applicant"} for "${selectedRequest?.opportunityTitle}". This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={isUpdating}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isUpdating}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors ${
                actionType === "accepted"
                  ? "bg-success/10 text-success hover:bg-success/20"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
              }`}
            >
              {isUpdating ? "Updating..." : actionType === "accepted" ? "Yes, Accept" : "Yes, Reject"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
