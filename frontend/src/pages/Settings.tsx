import { useState } from "react";
import { toast } from "sonner";

const defaultSettings = [
  { label: "Company Name", value: "C-78 PVT LTD" },
  { label: "Email", value: "admin@c78.com" },
  { label: "Notification Preferences", value: "Email & In-App" },
  { label: "AI Recommendations", value: "Enabled" },
  { label: "Language", value: "English" },
];

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(settings[idx].value);
  };

  const saveEdit = (idx: number) => {
    const updated = [...settings];
    updated[idx] = { ...updated[idx], value: editValue };
    setSettings(updated);
    setEditingIdx(null);
    toast.success("Setting updated!", { description: `${settings[idx].label} has been changed.` });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <div className="glass-card rounded-xl p-6 space-y-6">
        {settings.map((setting, idx) => (
          <div key={setting.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium">{setting.label}</p>
              {editingIdx === idx ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(idx)}
                  autoFocus
                  className="mt-1 w-full max-w-xs h-8 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">{setting.value}</p>
              )}
            </div>
            {editingIdx === idx ? (
              <div className="flex gap-2">
                <button onClick={() => saveEdit(idx)} className="text-xs text-primary font-medium hover:underline">Save</button>
                <button onClick={() => setEditingIdx(null)} className="text-xs text-muted-foreground font-medium hover:underline">Cancel</button>
              </div>
            ) : (
              <button onClick={() => startEdit(idx)} className="text-xs text-primary font-medium hover:underline">Edit</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
