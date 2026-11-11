import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="glass-card-hover rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-accent">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend.positive ? "text-success" : "text-destructive"}`}>
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
