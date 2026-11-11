import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCollaborations, createCollaboration, fetchApplications, createApplication, ApiError } from "@/lib/db";
import { Users, Handshake, Plus, X, ExternalLink, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Collaborations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: "",
    sector: "",
    budget: "",
    partnersNeeded: 1,
    requiredSkills: [] as string[],
    description: "",
    skillInput: "",
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const { data: collaborationsList = [] } = useQuery({
    queryKey: ["collaborations"],
    queryFn: fetchCollaborations,
  });

  // Track IDs+titles of non-withdrawn applied collaborations
  const appliedSet = new Set(
    applications
      .filter((a) => a.status !== "withdrawn")
      .flatMap((a) => [a.opportunityId, a.opportunityTitle].filter(Boolean))
  );
  const availableCollaborations = collaborationsList.filter(
    (c) => !appliedSet.has(c.id) && !appliedSet.has(c.projectTitle)
  );

  const handleSendRequest = async (collab: typeof collaborationsList[0]) => {
    try {
      await createApplication({
        opportunityId: collab.id,
        opportunityTitle: collab.projectTitle,
        opportunityType: "collaboration",
        ownerId: collab.createdBy || "",
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0],
        sector: collab.sector,
        budget: collab.budget,
        company: collab.companyName,
        location: "Pan India",
        description: collab.description,
      });

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["collaborations"] });
      toast.success("Collaboration request sent!", {
        description: `Your request to join "${collab.projectTitle}" has been submitted. Track it in My Applications.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to send request. Please try again.";
      toast.error(msg);
    }
  };

  const handleAddSkill = () => {
    if (formData.skillInput.trim()) {
      setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, formData.skillInput.trim()], skillInput: "" });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter((s) => s !== skill) });
  };

  const handlePostCollaboration = async () => {
    if (!formData.projectTitle || !formData.sector || !formData.budget || formData.requiredSkills.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }
    await createCollaboration({
      companyName: "C-78 PVT LTD",
      projectTitle: formData.projectTitle,
      requiredSkills: formData.requiredSkills,
      budget: formData.budget,
      sector: formData.sector,
      partnersNeeded: formData.partnersNeeded,
      description: formData.description,
    });
    queryClient.invalidateQueries({ queryKey: ["collaborations"] });
    toast.success("Collaboration posted!", { description: "Your collaboration request is now visible to other companies." });
    setShowForm(false);
    setFormData({ projectTitle: "", sector: "", budget: "", partnersNeeded: 1, requiredSkills: [], description: "", skillInput: "" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collaborations</h1>
          <p className="text-sm text-muted-foreground mt-1">Find partners and form consortiums for large projects.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> Post Collaboration
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Post a Collaboration</h2>
            <button onClick={() => setShowForm(false)} className="hover:opacity-70"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Project Title</label>
              <input type="text" value={formData.projectTitle} onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })} placeholder="e.g. Smart City Development" className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sector</label>
              <input type="text" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} placeholder="e.g. IT & Infrastructure" className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Budget</label>
              <input type="text" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="e.g. ₹10Cr" className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Partners Needed</label>
              <input type="number" value={formData.partnersNeeded} onChange={(e) => setFormData({ ...formData, partnersNeeded: parseInt(e.target.value) })} min="1" className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your project and what you're looking for..." className="w-full h-20 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mt-1" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Required Skills</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={formData.skillInput} onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }} placeholder="Add a skill" className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleAddSkill} className="h-9 px-3 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredSkills.map((skill) => (
                <span key={skill} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary flex items-center gap-2">
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handlePostCollaboration} className="flex-1 h-9 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Post Collaboration</button>
            <button onClick={() => setShowForm(false)} className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {availableCollaborations.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No open collaborations available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableCollaborations.map((collab) => (
            <div key={collab.id} className="glass-card-hover rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-accent">
                  <Handshake className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{collab.companyName}</p>
                  <p className="text-[11px] text-muted-foreground">{collab.sector}</p>
                </div>
              </div>
              <h3 className="text-sm font-semibold">{collab.projectTitle}</h3>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{collab.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {collab.requiredSkills.map((skill) => (
                  <span key={skill} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{skill}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{collab.budget}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{collab.partnersNeeded} partners needed</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleSendRequest(collab)} className="flex-1 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90">Send Request</button>
                <button onClick={() => navigate(`/collaborations/${collab.id}`)} className="flex-1 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborations;
