import { useQuery } from "@tanstack/react-query";
import { fetchApplications, fetchOpportunities } from "@/lib/db";
import type { Application, Opportunity } from "@/data/dummy";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Dated = { createdAt?: string };

/** The last `n` calendar months (oldest first) ending with the current month. */
function lastMonths(n: number): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()] };
  });
}

const monthOf = (o: Dated) => (o.createdAt ?? "").slice(0, 7);

/** Opportunity Concentration Index inputs: 0-100 where 100 = opportunities spread evenly across posters. */
function fairnessScore(opps: Opportunity[]): number {
  if (!opps.length) return 0;
  const counts = new Map<string, number>();
  opps.forEach((o) => counts.set(o.postedBy, (counts.get(o.postedBy) ?? 0) + 1));
  const hhi = [...counts.values()].reduce((sum, c) => sum + (c / opps.length) ** 2, 0);
  return Math.round((1 - hhi) * 100);
}

export function buildAnalytics(opportunities: Opportunity[], applications: Application[]) {
  const months = lastMonths(6);

  const bySector = new Map<string, number>();
  opportunities.forEach((o) => bySector.set(o.sector, (bySector.get(o.sector) ?? 0) + 1));
  const sectorData = [...bySector.entries()]
    .map(([name, count]) => ({
      name,
      opportunities: count,
      growth: Math.round((count / Math.max(opportunities.length, 1)) * 100),
    }))
    .sort((a, b) => b.opportunities - a.opportunities)
    .slice(0, 7);

  const trendData = months.map(({ key, label }) => ({
    month: label,
    opportunities: opportunities.filter((o) => monthOf(o as Dated) === key).length,
    applications: applications.filter((a) => monthOf(a) === key).length,
    matches: opportunities.filter((o) => monthOf(o as Dated) === key && (o.matchScore ?? 0) >= 80).length,
  }));

  const byOrg = new Map<string, number>();
  opportunities.forEach((o) => byOrg.set(o.postedBy, (byOrg.get(o.postedBy) ?? 0) + 1));
  const orgs = [...byOrg.entries()].sort((a, b) => b[1] - a[1]);
  const share = (c: number) => Math.round((c / Math.max(opportunities.length, 1)) * 100);
  const applicants = new Set(applications.map((a) => a.applicantCompany || a.applicantId).filter(Boolean));

  const fairnessData = {
    marketFairnessScore: fairnessScore(opportunities),
    msmeParticipationRate: applications.length ? Math.round((applicants.size / applications.length) * 100) : 0,
    topCompanyShare: orgs.length ? share(orgs[0][1]) : 0,
    smallBusinessShare: orgs.length ? 100 - share(orgs[0][1]) : 0,
    distributionData: orgs.slice(0, 4).map(([name, count]) => ({ name, share: share(count), count })),
    monthlyFairness: months.map(({ key, label }) => {
      const upTo = opportunities.filter((o) => monthOf(o as Dated) !== "" && monthOf(o as Dated) <= key);
      const appsUpTo = applications.filter((a) => monthOf(a) !== "" && monthOf(a) <= key);
      const distinct = new Set(appsUpTo.map((a) => a.applicantCompany || a.applicantId).filter(Boolean));
      return {
        month: label,
        score: fairnessScore(upTo),
        participation: appsUpTo.length ? Math.round((distinct.size / appsUpTo.length) * 100) : 0,
      };
    }),
  };

  const growthData = months.map(({ key, label }) => ({
    month: label,
    applications: applications.filter((a) => monthOf(a) === key).length,
    accepted: applications.filter((a) => monthOf(a) === key && a.status === "accepted").length,
  }));

  return { sectorData, trendData, fairnessData, growthData };
}

/** Live analytics derived from Firestore (opportunities + the user's applications). */
export function useMarketAnalytics() {
  const { data: opportunities = [] } = useQuery({ queryKey: ["opportunities"], queryFn: fetchOpportunities });
  const { data: applications = [] } = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  return { opportunities, applications, ...buildAnalytics(opportunities, applications) };
}
