import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGovTenders, createGovTender, updateGovTender, deleteGovTender } from "@/lib/db";
import type { GovTender } from "@/lib/db";
import { Landmark, Plus, Pencil, Trash2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

const empty: Omit<GovTender, "id"> = {
  title: "", department: "", location: "", budget: "", deadline: "",
  sector: "", verified: false, description: "", fullDescription: "", applyLink: "", status: "active",
};

const AdminTenders = () => {
  const qc = useQueryClient();
  const { data: tenders = [], isLoading } = useQuery({ queryKey: ["gov-tenders"], queryFn: fetchGovTenders });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GovTender | null>(null);
  const [form, setForm] = useState<Omit<GovTender, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(empty); setEditing(null); setShowForm(true); };
  const openEdit = (t: GovTender) => { setForm({ title: t.title, department: t.department, location: t.location, budget: t.budget, deadline: t.deadline, sector: t.sector, verified: t.verified, description: t.description, fullDescription: t.fullDescription || "", applyLink: t.applyLink || "", status: t.status }); setEditing(t); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.title || !form.department || !form.sector) { toast.error("Title, department and sector are required."); return; }
    setSaving(true);
    try {
      if (editing) { await updateGovTender(editing.id, form); toast.success("Tender updated!"); }
      else { await createGovTender(form); toast.success("Tender posted!"); }
      qc.invalidateQueries({ queryKey: ["gov-tenders"] });
      closeForm();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteGovTender(id);
    qc.invalidateQueries({ queryKey: ["gov-tenders"] });
    toast.success("Tender deleted.");
  };

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Landmark className="h-6 w-6 text-primary" /> Manage Tenders</h1>
          <p className="text-sm text-muted-foreground mt-1">Post, edit or remove government tenders.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> New Tender
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{editing ? "Edit Tender" : "Post New Tender"}</h2>
            <button onClick={closeForm}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {([["title","Title *"],["department","Department *"],["location","Location"],["budget","Budget (e.g. ₹5Cr - ₹10Cr)"],["deadline","Deadline (YYYY-MM-DD)"],["sector","Sector *"],["applyLink","Apply Link (URL)"]] as [keyof typeof form, string][]).map(([k, label]) => (
              <div key={k} className={k === "applyLink" ? "md:col-span-2" : ""}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                <input value={form[k] as string} onChange={(e) => set(k, e.target.value)} className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none">
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="verified-t" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} className="h-4 w-4 accent-primary" />
              <label htmlFor="verified-t" className="text-sm">Mark as Verified</label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Short Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Description</label>
            <textarea value={form.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="h-9 px-5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Update" : "Post Tender"}
            </button>
            <button onClick={closeForm} className="h-9 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : tenders.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground text-sm">No tenders yet. Post the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenders.map((t) => (
            <div key={t.id} className="glass-card rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t.sector}</span>
                  {t.verified && <span className="flex items-center gap-1 text-[11px] text-success"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
                </div>
                <p className="font-semibold text-sm mt-1">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.department} · {t.location} · {t.budget} · Due {t.deadline}</p>
                {t.applyLink && <p className="text-xs text-primary mt-1 truncate">Apply → {t.applyLink}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Edit"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(t.id, t.title)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTenders;
