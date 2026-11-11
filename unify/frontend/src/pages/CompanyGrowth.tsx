import { sectorData, trendData } from "@/data/dummy";
import { TrendingUp, BarChart3, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const companyGrowthData = [
  { month: "Oct", revenue: 12, projects: 3, clients: 8 },
  { month: "Nov", revenue: 15, projects: 4, clients: 10 },
  { month: "Dec", revenue: 14, projects: 3, clients: 11 },
  { month: "Jan", revenue: 19, projects: 5, clients: 14 },
  { month: "Feb", revenue: 23, projects: 6, clients: 16 },
  { month: "Mar", revenue: 28, projects: 7, clients: 19 },
];

const CompanyGrowth = () => (
  <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Company Growth Analytics
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Track your company's growth alongside sector trends.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass-card rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground font-medium">Revenue Growth</p>
        <p className="text-3xl font-bold mt-2 text-success">+42%</p>
        <p className="text-xs text-muted-foreground mt-1">vs last quarter</p>
      </div>
      <div className="glass-card rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground font-medium">Projects Won</p>
        <p className="text-3xl font-bold mt-2 text-primary">7</p>
        <p className="text-xs text-muted-foreground mt-1">This quarter</p>
      </div>
      <div className="glass-card rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground font-medium">Client Base</p>
        <p className="text-3xl font-bold mt-2 text-secondary">19</p>
        <p className="text-xs text-muted-foreground mt-1">Active clients</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Company Revenue Trend (₹ Lakhs)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={companyGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Sector Growth Rates (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sectorData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Bar dataKey="growth" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} name="Growth %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-4">Opportunity & Application Trends</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Line type="monotone" dataKey="opportunities" stroke="hsl(221, 83%, 53%)" strokeWidth={2} name="Opportunities" />
            <Line type="monotone" dataKey="applications" stroke="hsl(262, 83%, 58%)" strokeWidth={2} name="Applications" />
            <Line type="monotone" dataKey="matches" stroke="hsl(142, 71%, 45%)" strokeWidth={2} name="AI Matches" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default CompanyGrowth;
