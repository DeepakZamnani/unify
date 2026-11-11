// ============================================================
// UNIFY – Canonical TypeScript Interfaces (mirrors backend schemas)
// ============================================================

// --------------- Auth & User --------------------------------

export type UserRole = "MSME" | "ADMIN" | "CONSULTANT" | "VENDOR";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Token {
  access_token: string;
  token_type: "bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: UserRole;
}

// --------------- Company profile (Firestore profile/main) -------------

export interface MSMEProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  location: string | null;
  employees: number | null;
  capabilities: string[];
  certifications: string[];
  bio: string | null;
}

// --------------- Opportunities --------------------------------

export type OpportunityType = "tender" | "contract" | "collaboration" | "grant";

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization: string;
  type: OpportunityType;
  sector: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string; // ISO date string
  is_verified: boolean;
}

// --------------- COMS Matching --------------------------------

/** Color-coded tag from the explainability engine */
export type ExplainabilityTagKind =
  | "sector_aligned"
  | "high_capability_match"
  | "budget_fit"
  | "verified_opportunity"
  | "experience_match"
  | "low_match";

export interface ExplainabilityTag {
  label: string;
  kind: ExplainabilityTagKind;
}

export interface CapabilityOverlap {
  percentage: number;
  matched_skills: string[];
}

export interface OpportunityMatch {
  opportunity_id: string;
  title: string;
  organization: string;
  sector: string;
  opportunity_type: string;
  vector_similarity: number;    // 0–1
  capability_overlap: number;   // 0–1
  coms_score: number;           // 0–1 composite
  explainability_tags: string[]; // raw tag strings from backend
}

export interface MatchResponse {
  msme_id: string;
  top_k: number;
  total_matches: number;
  matches: OpportunityMatch[];
}

export interface MatchFilters {
  sector?: string[];
  is_verified?: boolean;
}

// --------------- API error wrapper ---------------------------

export interface APIError {
  detail: string;
  status: number;
}
