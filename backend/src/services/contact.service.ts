import { ContactType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

export interface CreateContactInput {
  type: ContactType;
  note?: string | null;
  date: Date;
}

async function assertClientOwnership(userId: string, clientId: string): Promise<void> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
  if (!client) {
    throw AppError.notFound("Client not found");
  }
}

export async function createContact(userId: string, clientId: string, input: CreateContactInput) {
  await assertClientOwnership(userId, clientId);
  return prisma.contact.create({
    data: {
      type: input.type,
      note: input.note ?? null,
      date: input.date,
      clientId,
      userId,
    },
  });
}

export async function getContactsByClient(userId: string, clientId: string) {
  await assertClientOwnership(userId, clientId);
  return prisma.contact.findMany({
    where: { clientId, userId },
    orderBy: { date: "desc" },
  });
}

export async function deleteContact(userId: string, clientId: string, id: string): Promise<void> {
  const result = await prisma.contact.deleteMany({ where: { id, clientId, userId } });
  if (result.count === 0) {
    throw AppError.notFound("Contact not found");
  }
}