import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, AlertCircle, ChevronDown, Sparkles, Search, FileText, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AI_URL, authHeaders } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant" | "system";

interface ToolResult {
  tool_name: string;
  result: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolResults?: ToolResult[];
  isStreaming?: boolean;
  error?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────


const SUGGESTED_PROMPTS = [
  { icon: Search, label: "Find opportunities", text: "Find me procurement opportunities in the energy sector" },
  { icon: FileText, label: "Contract status", text: "What's the status of my contracts?" },
  { icon: Sparkles, label: "Match explanation", text: "How does COMS matching work?" },
  { icon: HelpCircle, label: "Platform help", text: "What subscription plans does UNIFY offer?" },
];

// ─── Tool Result Cards ──────────────────────────────────────────────────────

function OpportunityResultCard({ result }: { result: Record<string, unknown> }) {
  const opps = result.opportunities as Array<Record<string, unknown>> | undefined;
  if (!opps || opps.length === 0) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
        No opportunities found matching your query.
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      {opps.map((opp, i) => (
        <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-white text-sm leading-tight">{opp.title as string}</span>
            {opp.is_verified && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">Verified</span>
            )}
          </div>
          <div className="mt-1 text-slate-400">{opp.organization as string} · {opp.sector as string}</div>
          <div className="mt-1 text-slate-500">Deadline: {opp.deadline as string}</div>
          {(opp.budget_min || opp.budget_max) && (
            <div className="mt-1 text-slate-400">
              Budget: ₹{opp.budget_min ? Number(opp.budget_min).toLocaleString("en-IN") : "—"} – ₹{opp.budget_max ? Number(opp.budget_max).toLocaleString("en-IN") : "—"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ContractStatusCard({ result }: { result: Record<string, unknown> }) {
  const statusColors: Record<string, string> = {
    UNDER_REVIEW: "bg-yellow-500/20 text-yellow-400",
    VERIFIED: "bg-blue-500/20 text-blue-400",
    ESCROW_PENDING: "bg-purple-500/20 text-purple-400",
    ACTIVE: "bg-emerald-500/20 text-emerald-400",
    COMPLETED: "bg-slate-500/20 text-slate-400",
    DISPUTED: "bg-red-500/20 text-red-400",
  };
  const status = result.status as string;
  const colorClass = statusColors[status] ?? "bg-slate-500/20 text-slate-400";

  return (
    <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>{status}</span>
        <span className="text-slate-400">₹{Number(result.agreed_amount).toLocaleString("en-IN")}</span>
      </div>
      <div className="mt-2 text-slate-400">
        Milestones: {result.milestones_completed as number}/{result.milestones_total as number} completed
      </div>
      {(result.milestone_details as Array<Record<string, unknown>>)?.slice(0, 3).map((m, i) => (
        <div key={i} className="mt-1 flex items-center gap-2 text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${m.is_completed ? "bg-emerald-400" : "bg-slate-600"}`} />
          {m.title as string} ({m.payout_percentage as number}%)
        </div>
      ))}
    </div>
  );
}

function ToolResultDisplay({ toolResults }: { toolResults: ToolResult[] }) {
  return (
    <div className="space-y-2">
      {toolResults.map((tr, i) => {
        if (tr.result.error) {
          return (
            <div key={i} className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {tr.result.error as string}
            </div>
          );
        }
        if (tr.tool_name === "search_opportunities") {
          return <OpportunityResultCard key={i} result={tr.result} />;
        }
        if (tr.tool_name === "get_contract_status") {
          return <ContractStatusCard key={i} result={tr.result} />;
        }
        return null;
      })}
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${isUser ? "bg-primary/20" : "bg-indigo-500/20"}`}>
        {isUser ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-indigo-400" />}
      </div>

      {/* Content */}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : message.error
              ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm"
              : "bg-white/8 border border-white/10 text-slate-200 rounded-tl-sm"
          }`}
        >
          {message.content || (message.isStreaming ? "" : "…")}
          {message.isStreaming && (
            <span className="inline-block w-1 h-3.5 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Tool results */}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="w-full mt-1">
            <ToolResultDisplay toolResults={message.toolResults} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ChatWidget ────────────────────────────────────────────────────────

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const addMessage = (msg: Omit<ChatMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  };

  const updateMessage = (id: string, updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setInput("");
      setIsLoading(true);

      // Add user message
      addMessage({ role: "user", content: text.trim() });

      // Create assistant placeholder
      const assistantId = addMessage({ role: "assistant", content: "", isStreaming: true, toolResults: [] });

      // Build messages for API
      const historyMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() },
      ].filter((m) => m.role !== "system");

      // Start SSE fetch
      abortRef.current = new AbortController();

      try {
        const response = await fetch(`${AI_URL}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({ messages: historyMessages }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(errBody.detail || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        const pendingToolResults: ToolResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const event = JSON.parse(data) as {
                delta: string;
                type?: string;
                done?: boolean;
                tools?: string[];
                tool_name?: string;
                result?: Record<string, unknown>;
              };

              if (event.type === "text" && event.delta) {
                updateMessage(assistantId, (m) => ({
                  ...m,
                  content: m.content + event.delta,
                }));
              } else if (event.type === "tool_result" && event.tool_name && event.result) {
                pendingToolResults.push({ tool_name: event.tool_name, result: event.result });
                updateMessage(assistantId, (m) => ({
                  ...m,
                  toolResults: [...pendingToolResults],
                }));
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }

        // Mark streaming done
        updateMessage(assistantId, (m) => ({ ...m, isStreaming: false }));
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") {
          updateMessage(assistantId, (m) => ({ ...m, isStreaming: false, content: m.content || "(cancelled)" }));
        } else {
          const msg = err instanceof Error ? err.message : "Unknown error";
          updateMessage(assistantId, (m) => ({
            ...m,
            isStreaming: false,
            content: `Sorry, I couldn't connect to the AI service. ${msg}`,
            error: true,
          }));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  };

  const roleLabel = user?.isAdmin ? "Admin" : "MSME";

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-slate-700 text-slate-300 rotate-0 scale-95"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-110 hover:shadow-indigo-500/40"
        }`}
        aria-label={open ? "Close chat" : "Open UNIFY Assistant"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-6 w-6" />}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{ height: "560px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-indigo-900/60 to-purple-900/40 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight">UNIFY Assistant</h3>
            <p className="text-[11px] text-slate-400 truncate">
              {roleLabel} mode · AI-powered Q&amp;A
            </p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors text-xs"
                title="Clear chat"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="h-full flex flex-col items-center justify-center text-center px-2">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center mb-4">
                <Bot className="h-7 w-7 text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">How can I help you?</h4>
              <p className="text-xs text-slate-500 mb-6 max-w-[260px]">
                Ask me about opportunities, match scores, contracts, or how UNIFY works.
              </p>
              {/* Suggested prompts */}
              <div className="w-full grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.text)}
                    className="flex flex-col items-start gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-indigo-500/30 transition-all text-left group"
                  >
                    <p.icon className="h-3.5 w-3.5 text-indigo-400 group-hover:text-indigo-300" />
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 px-3 py-3 border-t border-white/10 bg-slate-900/60">
          <div className="flex items-end gap-2 bg-white/6 border border-white/10 rounded-xl px-3 py-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about opportunities, matches, or contracts…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none resize-none max-h-24 leading-relaxed"
              style={{ overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
