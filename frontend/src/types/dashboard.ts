import type { Stage, StageStats } from "./client";

/**
 * Presentation-friendly contact type. The API layer lower-cases the backend
 * `CALL | EMAIL | MEETING` enum so UI code never has to know the wire format.
 */
export type DashboardContactType = "call" | "email" | "meeting";

export interface DashboardContact {
  id: string;
  clientId: string;
  clientName: string;
  type: DashboardContactType;
  date: string;
  notes?: string;
}

export interface NewClient {
  id: string;
  name: string;
  company: string;
  createdAt: string;
}

/** New clients per calendar day, keyed by a local `YYYY-MM-DD` day string. */
export interface DailyClientCount {
  date: string;
  count: number;
}

export interface StageCount {
  stage: Stage;
  count: number;
}

export interface DashboardKpis {
  totalClients: number;
  /** WON / (WON + LOST) * 100 — how often decided deals are won. */
  winRate: number;
  /** WON / LEAD * 100 — how many leads convert into wins. */
  conversionRate: number;
  /** LEAD + CONTACTED + PROPOSAL — deals still in play. */
  activeDeals: number;
}

export interface DashboardStats extends DashboardKpis {
  byStage: StageStats;
  newClientsThisMonth: number;
}

export const CONTACT_TYPE_LABELS: Record<DashboardContactType, string> = {
  call: "مكالمة",
  email: "بريد إلكتروني",
  meeting: "اجتماع",
};