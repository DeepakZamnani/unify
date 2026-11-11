interface MatchScoreBarProps {
  score: number;
  showLabel?: boolean;
}

export function MatchScoreBar({ score, showLabel = true }: MatchScoreBarProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-success";
    if (s >= 60) return "bg-warning";
    return "bg-destructive";
  };
  const getTextColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Match Score</span>
          <span className={`text-xs font-bold ${getTextColor(score)}`}>{score}%</span>
        </div>
      )}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
