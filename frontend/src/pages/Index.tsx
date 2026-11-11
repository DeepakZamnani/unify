import { Search, FileText, Link2, Brain, Boxes } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/shared/MetricCard";
import { OpportunityCard } from "@/components/shared/OpportunityCard";
import { buildAnalytics } from "@/lib/analytics";
import { useQuery } from "@tanstack/react-query";
import { fetchOpportunities, fetchApplications, fetchCollaborations, fetchSupplyChain } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: opportunities = [] } = useQuery({ queryKey: ["opportunities"], queryFn: fetchOpportunities });
  const { data: applications = [] } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const { data: collaborations = [] } = useQuery({ queryKey: ["collaborations"], queryFn: fetchCollaborations });
  const { data: supplyChain = [] } = useQuery({ queryKey: ["supply-chain"], queryFn: fetchSupplyChain });

  const { trendData, sectorData } = buildAnalytics(opportunities, applications);
  const appliedSet = new Set(applications.map((a) => a.opportunityId || a.opportunityTitle));
  const availableOpportunities = opportunities.filter((o) => !appliedSet.has(o.id) && !appliedSet.has(o.title));
  const topOpportunities = availableOpportunities.filter((o) => (o.matchScore || 0) >= 80).slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{user?.name || "C-78 PVT LTD"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here are the latest opportunities and supply chain requests for your business.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="cursor-pointer" onClick={() => navigate("/opportunities")}>
          <MetricCard title="Total Opportunities" value={availableOpportunities.length} description="Available for you" icon={Search} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/ai-recommendations")}>
          <MetricCard title="Recommended" value={topOpportunities.length} description="AI-matched for you" icon={Brain} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/applications")}>
          <MetricCard title="My Applications" value={applications.length} description="Submitted total" icon={FileText} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/collaborations")}>
          <MetricCard title="Collaborations" value={collaborations.length} description="Active opportunities" icon={Link2} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/supply-chain")}>
          <MetricCard title="Supply Chain" value={supplyChain.length} description="Open requirements" icon={Boxes} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Recommended Opportunities
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your Capability–Opportunity Matching Score (COMS)</p>
          </div>
          <button onClick={() => navigate("/ai-recommendations")} className="text-xs font-medium text-primary hover:underline">View All →</button>
        </div>
        {topOpportunities.length === 0 ? (
          <div className="text-center py-10 glass-card rounded-xl">
            <p className="text-sm text-muted-foreground">All recommended opportunities have been applied for!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/20 transition-colors" onClick={() => navigate("/company-growth")}>
          <h3 className="text-sm font-semibold mb-4">Opportunity Trends</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="opportunities" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="matches" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/20 transition-colors" onClick={() => navigate("/company-growth")}>
          <h3 className="text-sm font-semibold mb-4">Opportunities by Sector</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="opportunities" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
