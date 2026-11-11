import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Send,
  ChevronDown,
  X,
  Cpu,
  TrendingUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { matching, profiles, ApiError } from "@/lib/api";
import { createApplication, fetchOpportunities } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import type { OpportunityMatch, MSMEProfile, MatchFilters } from "@/types/api";

// ─── Tag Styling helpers ──────────────────────────────────────

interface TagMeta {
  label: string;
  colorClass: string;
  icon: React.ReactNode;
}

function resolveTagMeta(rawTag: string): TagMeta {
  const t = rawTag.toLowerCase();

  if (t.includes("sector") || t.includes("domain"))
    return {
      label: "Sector Aligned",
      colorClass:
        "bg-sky-500/10 border-sky-500/25 text-sky-400",
      icon: <Target className="h-3 w-3" />,
    };

  if (t.includes("capability") || t.includes("high") || t.includes("skill"))
    return {
      label: "High Capability Match",
      colorClass:
        "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
      icon: <Zap className="h-3 w-3" />,
    };

  if (t.includes("verified"))
    return {
      label: "Verified Opportunity",
      colorClass:
        "bg-violet-500/10 border-violet-500/25 text-violet-400",
      icon: <ShieldCheck className="h-3 w-3" />,
    };

  if (t.includes("budget") || t.includes("financ"))
    return {
      label: "Budget Fit",
      colorClass:
        "bg-amber-500/10 border-amber-500/25 text-amber-400",
      icon: <TrendingUp className="h-3 w-3" />,
    };

  return {
    label: rawTag,
    colorClass:
      "bg-muted/60 border-border text-muted-foreground",
    icon: <Info className="h-3 w-3" />,
  };
}

// ─── Score ring component ─────────────────────────────────────

function ScoreRing({
  score,
  size = 72,
}: {
  score: number;
  size?: number;
}) {
  const pct = Math.round(score * 100);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80
      ? "#34d399" // emerald
      : pct >= 60
        ? "#38bdf8" // sky
        : "#fbbf24"; // amber

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      aria-label={`COMS score ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span
          className="text-base font-bold"
          style={{ color }}
        >
          {pct}
        </span>
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
          COMS
        </span>
      </div>
    </div>
  );
}

// ─── Similarity mini-bar ──────────────────────────────────────

function MiniBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="premium-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-muted rounded-md w-3/4" />
          <div className="h-3 bg-muted rounded-md w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-muted rounded-full" />
            <div className="h-5 w-24 bg-muted rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────

function MatchCard({
  match,
  index,
}: {
  match: OpportunityMatch;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await createApplication({
        opportunityId: match.opportunity_id,
        opportunityTitle: match.title,
        opportunityType: match.opportunity_type,
        sector: match.sector,
        company: match.organization,
        message: `Applied via COMS Matching (score ${Math.round(match.coms_score * 100)}%).`,
      });
      toast.success("Application submitted!", {
        description: `Your application for "${match.title}" is now under My Applications.`,
      });
    } catch (err) {
      toast.error("Failed to apply", {
        description: err instanceof ApiError ? err.message : "Unknown error",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleViewDetails = () => {
    toast.info("Opening opportunity details…", {
      description: match.title,
    });
  };

  const typeBadgeColor: Record<string, string> = {
    tender: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    contract: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    collaboration: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    grant: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const typeCls =
    typeBadgeColor[match.opportunity_type.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border";

  return (
    <div
      className="premium-card-hover p-5 flex flex-col gap-4 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-4">
        <ScoreRing score={match.coms_score} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${typeCls}`}
            >
              {match.opportunity_type}
            </span>
            <span className="text-[11px] rounded-full border px-2.5 py-0.5 font-medium text-muted-foreground border-border/60 bg-muted/40">
              {match.sector}
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
            {match.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {match.organization}
          </p>
        </div>
      </div>

      {/* ── Similarity bars ── */}
      <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 space-y-2.5">
        <MiniBar
          label="Vector Similarity"
          value={match.vector_similarity}
          color="hsl(221 83% 53%)"
        />
        <MiniBar
          label="Capability Overlap"
          value={match.capability_overlap}
          color="hsl(142 71% 45%)"
        />
      </div>

      {/* ── Explainability tags ── */}
      {match.explainability_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.explainability_tags.map((raw) => {
            const meta = resolveTagMeta(raw);
            return (
              <span
                key={raw}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.colorClass}`}
              >
                {meta.icon}
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Expandable insight panel ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary font-medium transition-colors w-fit"
        aria-expanded={expanded}
      >
        <Cpu className="h-3.5 w-3.5" />
        Match Insights
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-3 animate-fade-in text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-muted-foreground">Vector Similarity</p>
              <p className="font-bold text-base text-foreground mt-0.5">
                {Math.round(match.vector_similarity * 100)}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-muted-foreground">Capability Overlap</p>
              <p className="font-bold text-base text-foreground mt-0.5">
                {Math.round(match.capability_overlap * 100)}%
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Opportunity ID:{" "}
            <span className="font-mono text-foreground/70 text-[10px] break-all">
              {match.opportunity_id}
            </span>
          </p>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleApply}
          disabled={isApplying}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isApplying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {isApplying ? "Applying..." : "Express Interest"}
        </button>
        <button
          onClick={handleViewDetails}
          className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Details
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────

const COMSMatchingDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [sectors, setSectors] = useState<string[]>(["All Sectors"]);

  // Sector filter options come from the live opportunities in Firestore
  useEffect(() => {
    fetchOpportunities().then((opps) =>
      setSectors(["All Sectors", ...Array.from(new Set(opps.map((o) => o.sector).filter(Boolean))).sort()]),
    );
  }, []);
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [profile, setProfile] = useState<MSMEProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [topK, setTopK] = useState(5);
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // ── Load profile on mount ──
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoading(false);
      return;
    }
    profiles
      .getMSMEProfile()
      .then(setProfile)
      .catch((err) => {
        if (!(err instanceof ApiError && (err.status === 404 || err.status === 401))) {
          console.warn("Profile fetch failed:", err);
        }
      })
      .finally(() => setProfileLoading(false));
  }, []);

  // ── Run matching ──
  const runMatching = useCallback(async () => {
    if (!profile) {
      setError(
        "No MSME profile found. Please complete your profile before running COMS matching.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    const filters: MatchFilters = {
      ...(selectedSector !== "All Sectors"
        ? { sector: [selectedSector] }
        : {}),
      ...(verifiedOnly ? { is_verified: true } : {}),
    };

    try {
      const result = await matching.getOpportunitiesMatch(
        topK,
        filters,
      );
      setMatches(result.matches);
      if (result.matches.length === 0) {
        toast.info("No matches found", {
          description: "Try broadening your sector or disabling the verified-only filter.",
        });
      } else {
        toast.success(`Found ${result.total_matches} match${result.total_matches === 1 ? "" : "es"}`, {
          description: `COMS engine returned top-${result.top_k} opportunities.`,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (err.status === 404) {
          setError("MSME profile not found on the server. Please re-save your profile.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }, [profile, topK, selectedSector, verifiedOnly]);

  // ── Auto-run once profile loads ──
  useEffect(() => {
    if (!profileLoading && profile) {
      runMatching();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading]);

  const isLoggedIn = isAuthenticated;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ════ Page header ════ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            COMS Matching Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capability–Opportunity Matching Score · semantic embeddings over your
            live Firestore data
          </p>
        </div>

        {profile && (
          <div className="premium-card px-4 py-2.5 flex items-center gap-3 self-start">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {profile.company_name[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold leading-none text-foreground">
                {profile.company_name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {profile.industry ?? "Company profile"} · {profile.capabilities.length} capabilities
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ════ Filter bar ════ */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Match Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Top-K slider */}
          <div className="space-y-2">
            <label
              htmlFor="top-k-slider"
              className="text-xs font-medium text-muted-foreground flex justify-between"
            >
              <span>Results (Top-K)</span>
              <span className="font-bold text-foreground">{topK}</span>
            </label>
            <input
              id="top-k-slider"
              type="range"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-muted cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          {/* Sector filter */}
          <div className="space-y-2">
            <label
              htmlFor="sector-select"
              className="text-xs font-medium text-muted-foreground"
            >
              Sector Filter
            </label>
            <div className="relative">
              <select
                id="sector-select"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/60 bg-card/60 px-3 pr-8 text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Verified toggle + Run button */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between h-9 rounded-lg border border-border/60 bg-card/60 px-3">
              <label
                htmlFor="verified-toggle"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Verified Only
              </label>
              <button
                id="verified-toggle"
                role="switch"
                aria-checked={verifiedOnly}
                onClick={() => setVerifiedOnly((p) => !p)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  verifiedOnly
                    ? "gradient-primary"
                    : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    verifiedOnly ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              id="run-coms-btn"
              onClick={runMatching}
              disabled={loading || !isLoggedIn}
              className="flex items-center justify-center gap-2 h-9 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Running COMS…
                </>
              ) : (
                <>
                  <Brain className="h-3.5 w-3.5" />
                  Run Match
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ════ Not logged-in state ════ */}
      {!isLoggedIn && (
        <div className="premium-card p-8 text-center flex flex-col items-center gap-3">
          <AlertCircle className="h-10 w-10 text-amber-400" />
          <p className="font-semibold text-foreground">Session Required</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            You need to be logged in with a JWT token to query the COMS matching
            engine. Please log in and your token will be used automatically.
          </p>
        </div>
      )}

      {/* ════ Error state ════ */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-destructive/60 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ════ Results grid ════ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: topK > 6 ? 6 : topK }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : matches.length > 0 ? (
        <>
          {/* Summary banner */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {matches.length}
              </span>{" "}
              ranked match{matches.length !== 1 ? "es" : ""} · Sorted by COMS
              score
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((m, i) => (
              <MatchCard key={m.opportunity_id} match={m} index={i} />
            ))}
          </div>
        </>
      ) : (
        isLoggedIn &&
        !profileLoading && (
          /* Empty state */
          <div className="premium-card p-12 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">
                No matches yet
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {profile
                  ? <>Click &ldquo;Run Match&rdquo; to query the COMS engine with your current filters.</>
                  : <>Complete your MSME profile first, then click &ldquo;Run Match&rdquo; to discover opportunities.</>
                }
              </p>
            </div>
            {profile && (
              <button
                onClick={runMatching}
                className="flex items-center gap-2 h-10 px-5 rounded-lg gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                <Brain className="h-4 w-4" />
                Run COMS Matching
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default COMSMatchingDashboard;
