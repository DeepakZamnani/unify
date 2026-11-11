import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSupplyChain, createSupplyChainRequest, fetchApplications, createApplication, ApiError } from "@/lib/db";
import { MapPin, Calendar, Building2, Plus, ExternalLink, X, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const emptyForm = { title: "", sector: "", budget: "", quantity: "", deadline: "", location: "", description: "" };

const SupplyChain = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["supply-chain"],
    queryFn: fetchSupplyChain,
  });

  const appliedSet = new Set(
    applications
      .filter((a) => a.status !== "withdrawn")
      .flatMap((a) => [a.opportunityId, a.opportunityTitle].filter(Boolean))
  );
  const availableRequests = requests.filter(
    (r) => !appliedSet.has(r.id) && !appliedSet.has(r.title)
  );

  const handleSubmitProposal = async (req: typeof requests[0]) => {
    try {
      await createApplication({
        opportunityId: req.id,
        opportunityTitle: req.title,
        opportunityType: "supply-chain",
        ownerId: req.createdBy || "",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: req.sector,
        budget: req.budget,
        company: req.companyName,
        location: req.location,
        description: req.description,
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["supply-chain"] });
      toast.success("Proposal submitted!", {
        description: `Your proposal for "${req.title}" has been sent. Track it in My Applications.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit proposal. Please try again.";
      toast.error(msg);
    }
  };

  const handlePostRequirement = async () => {
    if (!form.title || !form.sector || !form.budget) {
      toast.error("Please fill in the required fields.");
      return;
    }
    await createSupplyChainRequest({
      companyName: "C-78 PVT LTD",
      title: form.title,
      sector: form.sector,
      quantity: form.quantity,
      budget: form.budget,
      location: form.location,
      deadline: form.deadline,
      description: form.description,
    });
    queryClient.invalidateQueries({ queryKey: ["supply-chain"] });
    toast.success("Requirement posted!", { description: "Your supply chain requirement is now visible to MSMEs." });
    setShowForm(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Private Supply Chain Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse procurement needs and submit proposals.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Post Requirement
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Post a Requirement</h3>
            <button onClick={() => setShowForm(false)} className="hover:opacity-70"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Requirement Title *", key: "title", placeholder: "e.g. Steel Beams" },
              { label: "Industry Sector *",   key: "sector", placeholder: "e.g. Construction" },
              { label: "Budget Range *",       key: "budget", placeholder: "e.g. ₹2Cr" },
              { label: "Required Capacity",    key: "quantity", placeholder: "e.g. 500 metric tons" },
              { label: "Deadline",             key: "deadline", placeholder: "YYYY-MM-DD" },
              { label: "Location",             key: "location", placeholder: "e.g. Mumbai" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-20 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handlePostRequirement} className="h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold">Submit</button>
            <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg border border-border text-xs font-medium hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {availableRequests.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No supply chain requirements available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableRequests.map((req) => (
            <div key={req.id} className="glass-card-hover rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">{req.sector}</span>
                <span className="text-xs font-bold text-foreground">{req.budget}</span>
              </div>
              <h3 className="text-sm font-semibold mt-2">{req.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Building2 className="h-3 w-3" />{req.companyName}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{req.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{req.deadline}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Qty: <span className="font-medium text-foreground">{req.quantity}</span></p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleSubmitProposal(req)} className="flex-1 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">Submit Proposal</button>
                <button onClick={() => navigate(`/supply-chain/${req.id}`)} className="flex-1 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" /> View Requirement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplyChain;
