import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, FileSearch } from "lucide-react";

const mediationSteps = [
  { title: "Profile Verification", desc: "UNIFY verifies company registration, certifications, and financial standing.", icon: FileSearch, status: "completed" },
  { title: "Application Review", desc: "All applications are reviewed for compliance and eligibility before forwarding.", icon: CheckCircle2, status: "completed" },
  { title: "Deal Verification", desc: "Contract terms, pricing, and deliverables are validated by UNIFY mediators.", icon: ShieldCheck, status: "active" },
  { title: "Escrow & Settlement", desc: "Payments are held in escrow until milestones are verified and approved.", icon: Clock, status: "pending" },
];

const activeDeals = [
  { id: "1", title: "Smart City Infrastructure – Phase 1", parties: "C-78 ↔ Ministry of Innovation", value: "₹1.2 Cr", status: "Under Review", statusColor: "text-warning" },
  { id: "2", title: "Agricultural Data Platform", parties: "C-78 ↔ AgriTech Corp", value: "₹45L", status: "Verified", statusColor: "text-success" },
  { id: "3", title: "Solar Component Supply", parties: "C-78 ↔ SolarPlus Ltd", value: "₹28L", status: "Pending Verification", statusColor: "text-muted-foreground" },
];

const Mediation = () => (
  <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        Platform Mediation
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        All deals on UNIFY go through verification and mediation to ensure trust and legitimacy.
      </p>
    </div>

    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><ShieldCheck className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-sm font-medium">UNIFY Trust & Mediation</p>
          <p className="text-xs text-muted-foreground mt-1">
            UNIFY acts as a trusted intermediary for all platform transactions. We verify company profiles, review applications, validate deal terms, and ensure secure payment settlement.
          </p>
        </div>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">Mediation Process</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mediationSteps.map((step, i) => (
          <div key={i} className={`glass-card rounded-xl p-5 ${step.status === "active" ? "border-primary/30 border-2" : ""}`}>
            <div className={`p-2 rounded-lg inline-flex mb-3 ${step.status === "completed" ? "bg-success/10" : step.status === "active" ? "bg-primary/10" : "bg-muted"}`}>
              <step.icon className={`h-5 w-5 ${step.status === "completed" ? "text-success" : step.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <h3 className="text-sm font-semibold">{step.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
            <span className={`text-[11px] font-medium mt-2 inline-block capitalize ${step.status === "completed" ? "text-success" : step.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
              {step.status === "active" ? "● In Progress" : step.status === "completed" ? "✓ Completed" : "○ Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">Active Deals</h2>
      <div className="space-y-3">
        {activeDeals.map((deal) => (
          <div key={deal.id} className="glass-card-hover rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{deal.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{deal.parties}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{deal.value}</p>
              <p className={`text-xs font-medium ${deal.statusColor}`}>{deal.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Mediation;
