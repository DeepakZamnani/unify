import { Check, Crown, Zap, Star } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Basic",
    price: "₹999",
    period: "/month",
    icon: Zap,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    features: [
      "Up to 10 opportunity views/month",
      "3 applications/month",
      "Basic messaging",
      "Email notifications",
      "Company profile listing",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Intermediate",
    price: "₹2,999",
    period: "/month",
    icon: Star,
    color: "text-primary",
    bgColor: "bg-primary/5",
    popular: true,
    features: [
      "Up to 50 opportunity views/month",
      "15 applications/month",
      "Sector analytics dashboard",
      "Collaboration tools",
      "Priority messaging",
      "AI recommendations (basic)",
      "Supply chain access",
    ],
    cta: "Upgrade",
    disabled: false,
  },
  {
    name: "Expert",
    price: "₹7,999",
    period: "/month",
    icon: Crown,
    color: "text-warning",
    bgColor: "bg-warning/5",
    features: [
      "Unlimited opportunity views",
      "Unlimited applications",
      "Full analytics dashboard",
      "Priority visibility to providers",
      "Advanced AI recommendations",
      "Government tender alerts",
      "Dedicated account manager",
      "Platform mediation priority",
      "Commission discounts",
    ],
    cta: "Upgrade",
    disabled: false,
  },
];

const Subscriptions = () => {
  const handleUpgrade = (planName: string) => {
    toast.success(`Upgrade to ${planName} initiated!`, { description: "You'll be redirected to complete payment." });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose the plan that fits your business needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`glass-card rounded-xl p-6 relative ${plan.popular ? "border-2 border-primary ring-2 ring-primary/10" : ""}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold gradient-primary text-primary-foreground px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className={`p-2.5 rounded-lg inline-flex ${plan.bgColor} mb-4`}>
              <plan.icon className={`h-5 w-5 ${plan.color}`} />
            </div>
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${plan.popular ? "text-primary" : "text-success"}`} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !plan.disabled && handleUpgrade(plan.name)}
              disabled={plan.disabled}
              className={`w-full h-10 rounded-lg text-sm font-semibold mt-6 transition-all ${
                plan.disabled
                  ? "bg-muted text-muted-foreground cursor-default"
                  : plan.popular
                  ? "gradient-primary text-primary-foreground hover:opacity-90"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 text-center">
        <h3 className="text-sm font-semibold">Revenue Model</h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">
          UNIFY earns through subscription plans and a small commission on successful deals executed through the platform, calculated based on the order or contract value. Expert plan subscribers get reduced commission rates.
        </p>
      </div>
    </div>
  );
};

export default Subscriptions;
