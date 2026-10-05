import { apiClient } from "./axios";
import { getClients } from "./clients";
import { STAGES, type Client, type StageStats } from "../types/client";
import type {
  DailyClientCount,
  DashboardContact,
  DashboardContactType,
  DashboardKpis,
  DashboardStats,
  NewClient,
} from "../types/dashboard";

const DASHBOARD_ENDPOINT = "/api/dashboard";
/** `GET /api/clients` caps `limit` at 100. */
const CLIENTS_PAGE_SIZE = 100;
/** Safety net so a huge dataset cannot turn the daily aggregation into a crawl. */
const MAX_CLIENTS_PAGES = 20;
export const DEFAULT_RECENT_CONTACTS_LIMIT = 5;
export const DEFAULT_NEW_CLIENTS_LIMIT = 5;
export const DEFAULT_DAILY_RANGE = 7;

interface DashboardRecentContact {
  id: string;
  type: string;
  note: string | null;
  date: string;
  clientId: string;
  clientName: string;
}

interface DashboardPayload {
  totalClients: number;
  byStage: StageStats;
  newClientsThisMonth: number;
  recentContacts: DashboardRecentContact[];
}

function emptyStageStats(): StageStats {
  return { LEAD: 0, CONTACTED: 0, PROPOSAL: 0, WON: 0, LOST: 0 };
}

function normalizeStageStats(byStage: Partial<StageStats> | undefined): StageStats {
  const result = emptyStageStats();
  for (const stage of STAGES) {
    const count = byStage?.[stage];
    result[stage] = typeof count === "number" && Number.isFinite(count) ? count : 0;
  }
  return result;
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10_000) / 100;
}

/** Pure so the KPI formulas stay reviewable (and unit-testable) on their own. */
export function buildDashboardKpis(byStage: StageStats): DashboardKpis {
  return {
    totalClients: STAGES.reduce((total, stage) => total + byStage[stage], 0),
    winRate: percentage(byStage.WON, byStage.WON + byStage.LOST),
    conversionRate: percentage(byStage.WON, byStage.LEAD),
    activeDeals: byStage.LEAD + byStage.CONTACTED + byStage.PROPOSAL,
  };
}

function toContactType(type: string): DashboardContactType {
  if (type === "CALL") return "call";
  if (type === "MEETING") return "meeting";
  return "email";
}

function toDashboardContact(contact: DashboardRecentContact): DashboardContact {
  return {
    id: contact.id,
    clientId: contact.clientId,
    clientName: contact.clientName,
    type: toContactType(contact.type),
    date: contact.date,
    ...(contact.note === null ? {} : { notes: contact.note }),
  };
}

async function fetchDashboardPayload(): Promise<DashboardPayload> {
  const response = await apiClient.get<DashboardPayload>(DASHBOARD_ENDPOINT);
  return response.data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const payload = await fetchDashboardPayload();
  const byStage = normalizeStageStats(payload.byStage);
  return {
    ...buildDashboardKpis(byStage),
    totalClients: payload.totalClients,
    byStage,
    newClientsThisMonth: payload.newClientsThisMonth,
  };
}

/**
 * The backend already ships the five most recent contacts with the stats
 * payload, so this reuses that response instead of a second round trip.
 * `limit` above 5 cannot return more than the server sends.
 */
export async function getRecentContacts(
  limit: number = DEFAULT_RECENT_CONTACTS_LIMIT,
): Promise<DashboardContact[]> {
  const payload = await fetchDashboardPayload();
  return payload.recentContacts
    .slice(0, normalizeLimit(limit))
    .map(toDashboardContact);
}

/** `GET /api/clients` is already sorted by `createdAt desc`, so page 1 is the newest. */
export async function getNewClients(
  limit: number = DEFAULT_NEW_CLIENTS_LIMIT,
): Promise<NewClient[]> {
  const result = await getClients({ page: 1, limit: normalizeLimit(limit) });
  return result.clients.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company ?? "",
    createdAt: client.createdAt,
  }));
}

/**
 * New clients per local calendar day for the last `lastDays` days, oldest first,
 * with empty days included so the line chart has no gaps.
 *
 * The backend has no per-day aggregate endpoint, so this pages through the
 * clients list — which is sorted by `createdAt desc` — and stops as soon as it
 * reaches a client older than the window.
 */
export async function getClientsByDay(
  lastDays: number = DEFAULT_DAILY_RANGE,
): Promise<DailyClientCount[]> {
  const days = Math.max(1, Math.floor(lastDays));
  const windowStart = startOfDay(addDays(new Date(), -(days - 1)));

  const counts = new Map<string, number>();
  for (let offset = 0; offset < days; offset += 1) {
    counts.set(toDayKey(addDays(windowStart, offset)), 0);
  }

  for (const client of await collectClientsSince(windowStart)) {
    const createdAt = new Date(client.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      continue;
    }
    const key = toDayKey(createdAt);
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
    }
  }

  return [...counts].map(([date, count]) => ({ date, count }));
}

async function collectClientsSince(windowStart: Date): Promise<Client[]> {
  const collected: Client[] = [];

  for (let page = 1; page <= MAX_CLIENTS_PAGES; page += 1) {
    const result = await getClients({ page, limit: CLIENTS_PAGE_SIZE });
    if (result.clients.length === 0) {
      break;
    }

    let reachedOlderClient = false;
    for (const client of result.clients) {
      if (new Date(client.createdAt) < windowStart) {
        reachedOlderClient = true;
        break;
      }
      collected.push(client);
    }

    if (reachedOlderClient || result.clients.length < CLIENTS_PAGE_SIZE) {
      break;
    }
  }

  return collected;
}

function normalizeLimit(limit: number): number {
  return Math.max(1, Math.floor(limit));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function toDayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}