import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/db";
import type { Notification } from "@/lib/db";

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localRead, setLocalRead] = useState<Record<string, boolean>>({});

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const displayed: Notification[] = notifications.map((n) => ({
    ...n,
    read: localRead[n.id] !== undefined ? localRead[n.id] : n.read,
  }));

  const markAllRead = async () => {
    const updates: Record<string, boolean> = {};
    displayed.forEach((n) => { updates[n.id] = true; });
    setLocalRead((prev) => ({ ...prev, ...updates }));
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("All notifications marked as read");
  };

  const handleClick = async (n: Notification) => {
    setLocalRead((prev) => ({ ...prev, [n.id]: true }));
    await markNotificationRead(n.id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    navigate(n.link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>
      <div className="space-y-2">
        {displayed.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${!n.read ? "border-l-2 border-l-primary" : ""}`}
          >
            <div className={`p-2 rounded-lg ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
              <Bell className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
