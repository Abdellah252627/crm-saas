import { type ContactType, Stage } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export type StageCounts = Record<Stage, number>;

const RECENT_CONTACTS_LIMIT = 5;

export interface RecentContact {
  id: string;
  type: ContactType;
  note: string | null;
  date: Date;
  createdAt: Date;
  clientId: string;
  clientName: string;
}

export interface DashboardStats {
  totalClients: number;
  byStage: StageCounts;
  wonRate: number;
  recentContacts: RecentContact[];
  newClientsThisMonth: number;
}

/** Minimal shapes the aggregator needs, so it can be exercised without Prisma. */
export interface StageAndCreatedAt {
  stage: Stage;
  createdAt: Date;
}

export interface ContactWithClientName {
  id: string;
  type: ContactType;
  note: string | null;
  date: Date;
  createdAt: Date;
  clientId: string;
  client: { name: string };
}

function emptyStageCounts(): StageCounts {
  return {
    LEAD: 0,
    CONTACTED: 0,
    PROPOSAL: 0,
    WON: 0,
    LOST: 0,
  };
}

function startOfCurrentMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Pure aggregation: stage distribution, the in-memory won rate, and the
 * client-name projection. Kept free of Prisma so it is directly unit testable.
 */
export function buildDashboardStats(
  clients: StageAndCreatedAt[],
  contacts: ContactWithClientName[],
  now: Date,
): DashboardStats {
  const monthStart = startOfCurrentMonthUtc(now);
  const byStage = emptyStageCounts();
  let newClientsThisMonth = 0;

  for (const client of clients) {
    byStage[client.stage] += 1;
    if (client.createdAt >= monthStart) {
      newClientsThisMonth += 1;
    }
  }

  const totalClients = clients.length;
  const wonRate = totalClients === 0 ? 0 : Math.round((byStage[Stage.WON] / totalClients) * 10000) / 100;

  const recentContacts: RecentContact[] = contacts.map((contact) => ({
    id: contact.id,
    type: contact.type,
    note: contact.note,
    date: contact.date,
    createdAt: contact.createdAt,
    clientId: contact.clientId,
    clientName: contact.client.name,
  }));

  return { totalClients, byStage, wonRate, recentContacts, newClientsThisMonth };
}

export async function getStats(userId: string): Promise<DashboardStats> {
  const [clients, contacts] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      select: { stage: true, createdAt: true },
    }),
    prisma.contact.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: RECENT_CONTACTS_LIMIT,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return buildDashboardStats(clients, contacts, new Date());
}