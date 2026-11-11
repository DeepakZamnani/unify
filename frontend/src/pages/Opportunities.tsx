import { useQuery } from "@tanstack/react-query";
import { fetchOpportunities, fetchApplications } from "@/lib/db";
import { buildAnalytics } from "@/lib/analytics";
import { OpportunityCard } from "@/components/shared/OpportunityCard";
import { Search, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import type { TooltipProps } from "recharts";

function PremiumChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey?.toString()} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? "hsl(var(--primary))" }} />
              {entry.name ?? entry.dataKey}
            </span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Opportunities = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });
  const { sectorData, trendData, fairnessData } = buildAnalytics(opportunities, applications);

  // Hide opportunities the user has already applied for
  const appliedSet = new Set(applications.map((a) => a.opportunityId || a.opportunityTitle));
  const filtered = opportunities.filter((opportunity) => {
    if (appliedSet.has(opportunity.id) || appliedSet.has(opportunity.title)) return false;
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) || opportunity.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || opportunity.type === selectedType;
    return matchesSearch && matchesType;
  });

  const types = ["all", "tender", "contract", "outsourcing", "collaboration"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Opportunities
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and apply for business opportunities across all sectors.</p>
      </div>

      <div className="premium-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-background/70 border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${selectedType === type ? "gradient-primary text-primary-foreground" : "bg-muted/50 border border-border/60 hover:bg-muted"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="premium-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Sector Growth (%)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectorData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="opportunitySectorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.95} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={86} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip content={<PremiumChartTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
              <Bar dataKey="growth" fill="url(#opportunitySectorGradient)" radius={[0, 10, 10, 0]} barSize={14} name="Growth %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="premium-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Demand Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="opportunityTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <Tooltip content={<PremiumChartTooltip />} cursor={{ stroke: "hsl(var(--primary) / 0.12)" }} />
              <Area type="monotone" dataKey="opportunities" stroke="hsl(var(--primary))" fill="url(#opportunityTrendGradient)" strokeWidth={2} dot={false} name="Opportunities" />
              <Line type="monotone" dataKey="matches" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="AI Matches" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="premium-card-hover p-5 lg:col-span-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">OCI</p>
            <h3 className="text-base font-semibold">Opportunity Concentration Index</h3>
            <p className="text-sm text-muted-foreground">Tracks whether opportunities are distributed across enterprise sizes instead of clustering around a few dominant firms.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-right shadow-sm">
            <p className="text-3xl font-bold tracking-tight text-foreground">{fairnessData.marketFairnessScore}</p>
            <p className="text-xs text-muted-foreground">Fairness score</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fairnessData.monthlyFairness} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="ociGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.35} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip content={<PremiumChartTooltip />} cursor={{ fill: "hsl(var(--secondary) / 0.06)" }} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--secondary))" strokeWidth={2.5} fill="url(#ociGradient)" dot={false} name="Fairness score" />
                <Line type="monotone" dataKey="participation" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="MSME participation" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">MSME Participation</p>
                <p className="mt-2 text-2xl font-semibold">{fairnessData.msmeParticipationRate}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Top Company Share</p>
                <p className="mt-2 text-2xl font-semibold">{fairnessData.topCompanyShare}%</p>
              </div>
            </div>

            <div className="space-y-2">
              {fairnessData.distributionData.map((bucket) => (
                <div key={bucket.name} className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{bucket.name}</span>
                    <span className="text-muted-foreground">{bucket.share}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted/70 overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${bucket.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No opportunities found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Opportunities;