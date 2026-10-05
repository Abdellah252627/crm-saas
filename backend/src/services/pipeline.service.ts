import { type Client, Stage } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

export type StageBuckets = Record<Stage, Client[]>;

const ALL_STAGES: Stage[] = [Stage.LEAD, Stage.CONTACTED, Stage.PROPOSAL, Stage.WON, Stage.LOST];

export async function updateClientStage(userId: string, clientId: string, stage: Stage): Promise<Client> {
  const result = await prisma.client.updateMany({
    where: { id: clientId, userId },
    data: { stage },
  });
  if (result.count === 0) {
    throw AppError.notFound("Client not found");
  }
  return prisma.client.findUniqueOrThrow({ where: { id: clientId } });
}

export async function getClientsByStage(userId: string): Promise<StageBuckets> {
  const buckets: StageBuckets = {
    LEAD: [],
    CONTACTED: [],
    PROPOSAL: [],
    WON: [],
    LOST: [],
  };

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  for (const client of clients) {
    buckets[client.stage].push(client);
  }

  return Object.fromEntries(ALL_STAGES.map((stage) => [stage, buckets[stage]])) as StageBuckets;
}