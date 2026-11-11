import { useState } from "react";
import { Send, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConversations, sendMessage, dummyConversations } from "@/lib/db";
import type { Conversation, ChatMessage } from "@/lib/db";

const Messages = () => {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string>("1");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({});

  const { data: conversations = dummyConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active = conversations.find((c) => c.id === activeConvId) ?? conversations[0];
  const extra = localMessages[activeConvId] ?? [];
  const allMessages: ChatMessage[] = active ? [...active.messages, ...extra] : [];

  const handleSend = async () => {
    if (!newMessage.trim() || !active) return;
    const text = newMessage;
    setNewMessage("");
    const msg = await sendMessage(active.id, text);
    setLocalMessages((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), msg] }));
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  if (!active) return null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in h-[calc(100vh-7rem)]">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Messages</h1>
      <div className="glass-card rounded-xl flex h-[calc(100%-3rem)] overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${activeConvId === conv.id ? "bg-muted/70" : ""}`}
              >
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-primary-foreground">{conv.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{conv.company}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="text-[10px] font-bold gradient-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{conv.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground">{active.avatar}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{active.name}</p>
              <p className="text-[11px] text-muted-foreground">{active.company}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {allMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3.5 py-2.5 rounded-xl text-sm ${msg.sender === "me" ? "gradient-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 h-10 px-4 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleSend} className="h-10 px-4 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
