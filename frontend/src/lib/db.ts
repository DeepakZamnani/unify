import { apiGet, apiPost, apiPatch, apiPut, apiDelete, ApiError } from './api';
import type { Opportunity, Application, SupplyChainRequest, Collaboration } from '../data/dummy';

export type { Opportunity, Application, SupplyChainRequest, Collaboration };
export { ApiError };

// ─── Opportunities ────────────────────────────────────────────────────────────

export async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    return await apiGet<Opportunity[]>('/opportunities');
  } catch {
    return [];
  }
}

export async function fetchOpportunity(id: string): Promise<Opportunity | null> {
  try {
    return await apiGet<Opportunity>(`/opportunities/${id}`);
  } catch {
    return null;
  }
}

export async function toggleSaveOpportunity(id: string, saved: boolean): Promise<void> {
  try {
    await apiPatch(`/opportunities/${id}/save`, { saved });
  } catch {
    // best-effort
  }
}

// ─── Applications ─────────────────────────────────────────────────────────────

/** Get applications submitted by the current user (My Applications) */
export async function fetchApplications(): Promise<Application[]> {
  try {
    return await apiGet<Application[]>('/applications');
  } catch {
    return [];
  }
}

/** Get incoming requests for opportunities created by the current user (Requests page) */
export async function fetchReceivedRequests(): Promise<Application[]> {
  try {
    return await apiGet<Application[]>('/applications/requests');
  } catch {
    return [];
  }
}

export async function fetchApplication(id: string): Promise<Application | null> {
  try {
    return await apiGet<Application>(`/applications/${id}`);
  } catch {
    return null;
  }
}

export async function createApplication(app: Partial<Application> & { opportunityTitle: string }): Promise<Application> {
  return await apiPost<Application>('/applications', app);
}

/** Update application status: 'accepted' | 'rejected' | 'withdrawn' */
export async function updateApplicationStatus(id: string, status: string): Promise<Application> {
  return await apiPatch<Application>(`/applications/${id}/status`, { status });
}

// ─── Supply Chain ─────────────────────────────────────────────────────────────

export async function fetchSupplyChain(): Promise<SupplyChainRequest[]> {
  try {
    return await apiGet<SupplyChainRequest[]>('/supply-chain');
  } catch {
    return [];
  }
}

export async function fetchSupplyChainRequest(id: string): Promise<SupplyChainRequest | null> {
  try {
    return await apiGet<SupplyChainRequest>(`/supply-chain/${id}`);
  } catch {
    return null;
  }
}

export async function createSupplyChainRequest(req: Omit<SupplyChainRequest, 'id'>): Promise<void> {
  await apiPost('/supply-chain', req);
}

// ─── Collaborations ───────────────────────────────────────────────────────────

export async function fetchCollaborations(): Promise<Collaboration[]> {
  try {
    return await apiGet<Collaboration[]>('/collaborations');
  } catch {
    return [];
  }
}

export async function fetchCollaboration(id: string): Promise<Collaboration | null> {
  try {
    return await apiGet<Collaboration>(`/collaborations/${id}`);
  } catch {
    return null;
  }
}

export async function createCollaboration(collab: Omit<Collaboration, 'id'>): Promise<void> {
  await apiPost('/collaborations', collab);
}

// ─── Government Contracts ─────────────────────────────────────────────────────

export interface GovContract {
  id: string;
  title: string;
  department: string;
  location: string;
  budget: string;
  deadline: string;
  sector: string;
  verified: boolean;
  description: string;
  fullDescription?: string;
  applyLink?: string;
  status: 'active' | 'closed';
}

export async function fetchGovContracts(): Promise<GovContract[]> {
  try {
    return await apiGet<GovContract[]>('/gov-contracts');
  } catch {
    return [];
  }
}

export async function fetchGovContract(id: string): Promise<GovContract | null> {
  try {
    return await apiGet<GovContract>(`/gov-contracts/${id}`);
  } catch {
    return null;
  }
}

export async function createGovContract(contract: Omit<GovContract, 'id'>): Promise<GovContract> {
  return apiPost<GovContract>('/gov-contracts', contract);
}

export async function updateGovContract(id: string, contract: Partial<GovContract>): Promise<void> {
  await apiPut(`/gov-contracts/${id}`, contract);
}

export async function deleteGovContract(id: string): Promise<void> {
  await apiDelete(`/gov-contracts/${id}`);
}

// ─── Government Tenders ───────────────────────────────────────────────────────

export interface GovTender {
  id: string;
  title: string;
  department: string;
  location: string;
  budget: string;
  deadline: string;
  sector: string;
  verified: boolean;
  description: string;
  fullDescription?: string;
  applyLink?: string;
  status: 'active' | 'closed';
}

export async function fetchGovTenders(): Promise<GovTender[]> {
  try {
    return await apiGet<GovTender[]>('/gov-tenders');
  } catch {
    return [];
  }
}

export async function fetchGovTender(id: string): Promise<GovTender | null> {
  try {
    return await apiGet<GovTender>(`/gov-tenders/${id}`);
  } catch {
    return null;
  }
}

export async function createGovTender(tender: Omit<GovTender, 'id'>): Promise<GovTender> {
  return apiPost<GovTender>('/gov-tenders', tender);
}

export async function updateGovTender(id: string, tender: Partial<GovTender>): Promise<void> {
  await apiPut(`/gov-tenders/${id}`, tender);
}

export async function deleteGovTender(id: string): Promise<void> {
  await apiDelete(`/gov-tenders/${id}`);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  company: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  messages: ChatMessage[];
}

export const dummyConversations: Conversation[] = [
  {
    id: '1', name: 'eshheet raka', company: 'BuildTech Industries', lastMessage: 'Can we discuss the supply chain proposal?', time: '2m ago', unread: 2, avatar: 'ER',
    messages: [
      { id: '1', text: 'Hi! We saw your profile on UNIFY and were impressed by your capabilities.', sender: 'them', time: '10:30 AM' },
      { id: '2', text: "Thank you, eshheet! We'd love to collaborate. What's the project scope?", sender: 'me', time: '10:32 AM' },
      { id: '3', text: 'We need IT infrastructure support for our new construction project. Budget is around ₹50L.', sender: 'them', time: '10:35 AM' },
      { id: '4', text: 'Can we discuss the supply chain proposal?', sender: 'them', time: '10:40 AM' },
    ],
  },
  {
    id: '2', name: 'gandharva ugale', company: 'AgriTech Corp', lastMessage: 'The collaboration agreement looks good!', time: '1h ago', unread: 0, avatar: 'GU',
    messages: [
      { id: '1', text: 'Hi, I wanted to follow up on the agricultural digitization project.', sender: 'me', time: '9:00 AM' },
      { id: '2', text: "Sure! We've reviewed your proposal and it looks promising.", sender: 'them', time: '9:15 AM' },
      { id: '3', text: 'The collaboration agreement looks good!', sender: 'them', time: '9:20 AM' },
    ],
  },
  {
    id: '3', name: 'farhaan khan', company: 'SolarPlus Ltd', lastMessage: 'When can we schedule a call?', time: '3h ago', unread: 1, avatar: 'FK',
    messages: [
      { id: '1', text: "We're interested in your IoT solutions for our solar farms.", sender: 'them', time: 'Yesterday' },
      { id: '2', text: 'That sounds great! We have extensive experience in that area.', sender: 'me', time: 'Yesterday' },
      { id: '3', text: 'When can we schedule a call?', sender: 'them', time: 'Today' },
    ],
  },
];

interface RawConversation {
  id: string;
  name: string;
  company: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  avatar: string;
  messages: { id: string; text: string; sender: 'me' | 'them'; createdAt: string }[];
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const data = await apiGet<RawConversation[]>('/conversations');
    return data.map((c) => ({
      id: c.id, name: c.name, company: c.company,
      lastMessage: c.lastMessage || '', avatar: c.avatar,
      time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      unread: c.unreadCount || 0,
      messages: (c.messages || []).map((m) => ({
        id: m.id, text: m.text, sender: m.sender,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    }));
  } catch {
    return [];
  }
}

export async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  try {
    const data = await apiPost<{ id: string; createdAt: string }>(`/conversations/${conversationId}/messages`, { text });
    return { id: data.id, text, sender: 'me', time: timeStr };
  } catch {
    return { id: Date.now().toString(), text, sender: 'me', time: timeStr };
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  link: string;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

interface RawNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  link: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const data = await apiGet<RawNotification[]>('/notifications');
    return data.map((row) => ({
      id: row.id, title: row.title, desc: row.description,
      time: relativeTime(row.createdAt), read: row.read, link: row.link,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiPatch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPatch('/notifications/read-all');
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  companyName: string;
  industry: string;
  employees: number;
  location: string;
  capabilities: string[];
  certifications: string[];
  bio: string;
  pastProjects: { name: string; client: string; year: number }[];
}

export async function fetchProfile(): Promise<Profile> {
  return await apiGet<Profile>('/profile');
}

export async function updateProfile(profile: Profile): Promise<void> {
  await apiPut('/profile', profile);
}
