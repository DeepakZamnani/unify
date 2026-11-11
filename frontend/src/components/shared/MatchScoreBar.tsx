import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface MatchScoreBreakdown {
  keywordMatch: number;
  domainExperience: number;
  vraExposureBoost: "Applied" | "Pending";
}

interface MatchScoreBarProps {
  score: number;
  showLabel?: boolean;
  breakdown?: MatchScoreBreakdown;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveBreakdown(score: number): MatchScoreBreakdown {
  return {
    keywordMatch: clampScore(score + 3),
    domainExperience: clampScore(score - 4),
    vraExposureBoost: score >= 85 ? "Applied" : "Pending",
  };
}

function getTone(score: number) {
  if (score >= 85) {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-400",
      glow: "shadow-[0_0_0_1px_hsl(142_71%_45%/0.18),0_0_24px_hsl(142_71%_45%/0.18)]",
    };
  }

  if (score >= 70) {
    return {
      badge: "border-sky-500/20 bg-sky-500/10 text-sky-400",
      dot: "bg-sky-400",
      glow: "shadow-[0_0_0_1px_hsl(199_89%_48%/0.16),0_0_24px_hsl(199_89%_48%/0.16)]",
    };
  }

  return {
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_0_1px_hsl(38_92%_50%/0.14),0_0_24px_hsl(38_92%_50%/0.14)]",
  };
}

function ScoreBadge({ score, label, tone }: { score: number; label: string; tone: ReturnType<typeof getTone> }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${tone.badge} ${tone.glow}`}
      aria-label={label}
    >
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className={`absolute inline-flex h-full w-full rounded-full ${tone.dot} opacity-75 animate-ping`} />
        <span className={`relative h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      </span>
      <span>{score}% Match</span>
    </button>
  );
}

function BreakdownPanel({ score, tone, breakdown }: { score: number; tone: ReturnType<typeof getTone>; breakdown: MatchScoreBreakdown }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">COMS Breakdown</p>
          <p className="text-xs text-muted-foreground">Capability–Opportunity Matching Score</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tone.badge}`}>{score}%</span>
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span>Keyword Match</span>
          <span className="font-medium text-foreground">{breakdown.keywordMatch}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span>Domain Experience</span>
          <span className="font-medium text-foreground">{breakdown.domainExperience}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span>VRA Exposure Boost</span>
          <span className={`font-medium ${breakdown.vraExposureBoost === "Applied" ? "text-emerald-400" : "text-amber-400"}`}>{breakdown.vraExposureBoost}</span>
        </div>
      </div>
    </div>
  );
}

export function MatchScoreBar({ score, showLabel = true, breakdown }: MatchScoreBarProps) {
  const tone = getTone(score);
  const resolvedBreakdown = breakdown ?? deriveBreakdown(score);

  return (
    <div className="space-y-1.5">
      {showLabel ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">COMS Match</span>
          <HoverCard>
            <HoverCardTrigger asChild>
              <span>
                <ScoreBadge score={score} label="View COMS breakdown" tone={tone} />
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
              <BreakdownPanel score={score} tone={tone} breakdown={resolvedBreakdown} />
            </HoverCardContent>
          </HoverCard>
        </div>
      ) : (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span>
              <ScoreBadge score={score} label="View COMS breakdown" tone={tone} />
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
            <BreakdownPanel score={score} tone={tone} breakdown={resolvedBreakdown} />
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}