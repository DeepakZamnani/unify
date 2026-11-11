import { auth } from "./firebase";
import type { MatchFilters, MatchResponse, MSMEProfile } from "@/types/api";

// ─── Express API (Firestore-backed CRUD: opportunities, applications, …) ───
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
// ─── FastAPI service (AI: COMS matching + chatbot) ───
export const AI_URL = import.meta.env.VITE_AI_URL || "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Authorization header carrying the signed-in user's Firebase ID token. */
export async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  return user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {};
}

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...(await authHeaders()),
  };
  if (options.body) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${baseUrl}. Is the backend running?`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error || body?.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const withBody = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

// Express
export const apiGet = <T>(path: string) => request<T>(API_URL, path);
export const apiPost = <T>(path: string, body?: unknown) => request<T>(API_URL, path, withBody("POST", body));
export const apiPut = <T>(path: string, body?: unknown) => request<T>(API_URL, path, withBody("PUT", body));
export const apiPatch = <T>(path: string, body?: unknown) => request<T>(API_URL, path, withBody("PATCH", body));
export const apiDelete = <T>(path: string) => request<T>(API_URL, path, { method: "DELETE" });

// FastAPI (AI)
export const matching = {
  /** POST /match/opportunities — COMS ranking of Firestore opportunities for the company profile. */
  getOpportunitiesMatch: (topK = 5, filters: MatchFilters = {}): Promise<MatchResponse> =>
    request<MatchResponse>(AI_URL, "/match/opportunities", withBody("POST", {
      top_k: topK,
      ...(filters.sector?.length ? { sector: filters.sector } : {}),
      ...(filters.is_verified !== undefined ? { is_verified: filters.is_verified } : {}),
    })),
};

export const profiles = {
  /** GET /profiles/me — company profile (Firestore profile/main). */
  getMSMEProfile: (): Promise<MSMEProfile> => request<MSMEProfile>(AI_URL, "/profiles/me"),
};
