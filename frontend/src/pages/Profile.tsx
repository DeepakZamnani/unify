import { Building2, MapPin, Users, Award, Briefcase, Edit3, Check, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile } from "@/lib/db";
import type { Profile as ProfileType } from "@/lib/db";

const Profile = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const { data: fetchedProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (fetchedProfile && !profile) setProfile(fetchedProfile);
  }, [fetchedProfile]);

  const handleSave = async () => {
    if (!profile) return;
    await updateProfile(profile);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setEditing(false);
    toast.success("Profile updated!", { description: "Your business profile has been saved." });
  };

  if (!profile) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        {editing ? (
          <button onClick={handleSave} className="h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2">
            <Check className="h-3.5 w-3.5" /> Save Profile
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="h-9 px-4 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2">
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary-foreground">
              {profile.companyName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Company Name</label>
                  <input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Industry</label>
                  <input value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Location</label>
                  <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bio</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full h-20 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mt-1" />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold">{profile.companyName}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3.5 w-3.5" />{profile.industry}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5" />{profile.location}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Users className="h-3.5 w-3.5" />{profile.employees} employees</p>
              </>
            )}
          </div>
        </div>
        {!editing && <p className="text-sm text-muted-foreground mt-4">{profile.bio}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Capabilities</h3>
          {editing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {profile.capabilities.map((cap) => (
                  <span key={cap} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary flex items-center gap-2">
                    {cap}
                    <button onClick={() => setProfile({ ...profile, capabilities: profile.capabilities.filter((c) => c !== cap) })} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new capability"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      setProfile({ ...profile, capabilities: [...profile.capabilities, e.currentTarget.value.trim()] });
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) { setProfile({ ...profile, capabilities: [...profile.capabilities, input.value.trim()] }); input.value = ""; }
                  }}
                  className="h-8 px-3 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.capabilities.map((cap) => (
                <span key={cap} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">{cap}</span>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-primary" />Certifications</h3>
          {editing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert) => (
                  <span key={cert} className="text-xs font-medium px-3 py-1.5 rounded-full bg-success/10 text-success flex items-center gap-2">
                    {cert}
                    <button onClick={() => setProfile({ ...profile, certifications: profile.certifications.filter((c) => c !== cert) })} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new certification"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      setProfile({ ...profile, certifications: [...profile.certifications, e.currentTarget.value.trim()] });
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) { setProfile({ ...profile, certifications: [...profile.certifications, input.value.trim()] }); input.value = ""; }
                  }}
                  className="h-8 px-3 rounded-lg bg-success/20 text-success text-xs font-medium hover:bg-success/30 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert) => (
                <span key={cert} className="text-xs font-medium px-3 py-1.5 rounded-full bg-success/10 text-success">{cert}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Past Projects</h3>
        {editing ? (
          <div className="space-y-3">
            {profile.pastProjects.map((proj, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Project Name</label>
                      <input value={proj.name} onChange={(e) => { const p = [...profile.pastProjects]; p[index] = { ...p[index], name: e.target.value }; setProfile({ ...profile, pastProjects: p }); }} className="w-full h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Client</label>
                      <input value={proj.client} onChange={(e) => { const p = [...profile.pastProjects]; p[index] = { ...p[index], client: e.target.value }; setProfile({ ...profile, pastProjects: p }); }} className="w-full h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Year</label>
                      <input type="number" value={proj.year} onChange={(e) => { const p = [...profile.pastProjects]; p[index] = { ...p[index], year: parseInt(e.target.value) }; setProfile({ ...profile, pastProjects: p }); }} className="w-full h-8 px-2 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <button onClick={() => setProfile({ ...profile, pastProjects: profile.pastProjects.filter((_, i) => i !== index) })} className="ml-2 h-8 px-2 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30 flex items-center gap-1">
                    <X className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setProfile({ ...profile, pastProjects: [...profile.pastProjects, { name: "New Project", client: "Client Name", year: new Date().getFullYear() }] })} className="w-full h-8 rounded-lg border-2 border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 flex items-center justify-center gap-1">
              <Plus className="h-3 w-3" /> Add New Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.pastProjects.map((proj) => (
              <div key={proj.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{proj.name}</p>
                  <p className="text-xs text-muted-foreground">{proj.client}</p>
                </div>
                <span className="text-xs text-muted-foreground">{proj.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
