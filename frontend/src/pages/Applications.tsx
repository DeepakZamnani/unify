import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApplications, updateApplicationStatus, ApiError } from "@/lib/db";
import { Clock, CheckCircle, XCircle, Eye, AlertCircle, Undo2, FileText } from "lucide-react";
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

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  reviewed: { icon: Eye, color: "text-info", bg: "bg-info/10", label: "Reviewed" },
  shortlisted: { icon: AlertCircle, color: "text-primary", bg: "bg-primary/10", label: "Shortlisted" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
  accepted: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Accepted" },
  withdrawn: { icon: Undo2, color: "text-muted-foreground", bg: "bg-muted/30", label: "Withdrawn" },
};

const typeColors: Record<string, string> = {
  collaboration: "bg-secondary/10 text-secondary",
  "supply-chain": "bg-warning/10 text-warning",
  requirement: "bg-info/10 text-info",
  tender: "bg-primary/10 text-primary",
  contract: "bg-success/10 text-success",
  opportunity: "bg-muted/30 text-muted-foreground",
};

const typeLabel: Record<string, string> = {
  collaboration: "Collaboration",
  "supply-chain": "Supply Chain",
  requirement: "Requirement",
  tender: "Tender",
  contract: "Contract",
  opportunity: "Opportunity",
};

const Applications = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Application | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: (id: string) => updateApplicationStatus(id, "withdrawn"),
    onSuccess: () => {
      toast.success("Application withdrawn successfully.");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setWithdrawOpen(false);
      setSelected(null);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to withdraw application.";
      toast.error(msg);
    },
  });

  const openWithdraw = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(app);
    setWithdrawOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground animate-pulse">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all your submitted applications and their current status.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-20 gap-4">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No applications yet.</p>
          <p className="text-muted-foreground/60 text-xs">
            Apply for opportunities, collaborations, or supply chain requests to see them here.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Opportunity</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Type</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Sector</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Budget</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Applied</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const sc = statusConfig[app.status] ?? statusConfig.pending;
                  const StatusIcon = sc.icon;
                  const tColor = typeColors[app.opportunityType ?? "opportunity"] ?? typeColors.opportunity;
                  const canWithdraw = app.status === "pending" || app.status === "reviewed";
                  return (
                    <tr
                      key={app.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium max-w-[200px]">
                        <span className="line-clamp-2">{app.opportunityTitle}</span>
                        {app.company && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{app.company}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {app.opportunityType && (
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${tColor}`}>
                            {typeLabel[app.opportunityType] ?? app.opportunityType}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{app.sector || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{app.budget || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                        {app.appliedDate
                          ? new Date(app.appliedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {canWithdraw && (
                          <button
                            onClick={(e) => openWithdraw(app, e)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                            title="Withdraw application"
                          >
                            <Undo2 className="h-3 w-3" />
                            Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Application?</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application for{" "}
              <span className="font-semibold text-foreground">"{selected?.opportunityTitle}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <button
              onClick={() => setWithdrawOpen(false)}
              disabled={isWithdrawing}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selected && withdraw(selected.id)}
              disabled={isWithdrawing}
              className="flex-1 h-10 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
            >
              {isWithdrawing ? "Withdrawing..." : "Yes, Withdraw"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Applications;
