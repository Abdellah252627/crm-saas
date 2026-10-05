import { Prisma, Stage, type Client } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

const contactsOrder = { orderBy: { date: "desc" } } as const;

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface CreateClientInput {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  stage?: Stage;
}

export interface ListClientsFilters {
  stage?: Stage;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateClientInput extends CreateClientInput {
  stage?: Stage;
}

export interface PaginatedClients {
  clients: Client[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toNullable(value: string | null | undefined): string | null {
  return value ?? null;
}

export async function createClient(userId: string, input: CreateClientInput) {
  return prisma.client.create({
    data: {
      name: input.name,
      company: toNullable(input.company),
      email: toNullable(input.email),
      phone: toNullable(input.phone),
      city: toNullable(input.city),
      stage: input.stage ?? Stage.LEAD,
      userId,
    },
  });
}

function buildListWhere(userId: string, filters: ListClientsFilters): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = { userId };

  if (filters.stage) {
    where.stage = filters.stage;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getClients(
  userId: string,
  filters: ListClientsFilters,
): Promise<PaginatedClients> {
  const where = buildListWhere(userId, filters);
  const limit = Math.min(filters.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(filters.page ?? 1, 1);

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    count: clients.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getClientById(userId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: { contacts: contactsOrder },
  });
  if (!client) {
    throw AppError.notFound("Client not found");
  }
  return client;
}

export async function updateClient(userId: string, id: string, input: UpdateClientInput) {
  const data: Prisma.ClientUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.company !== undefined) data.company = toNullable(input.company);
  if (input.email !== undefined) data.email = toNullable(input.email);
  if (input.phone !== undefined) data.phone = toNullable(input.phone);
  if (input.city !== undefined) data.city = toNullable(input.city);
  if (input.stage !== undefined) data.stage = input.stage;

  const result = await prisma.client.updateMany({ where: { id, userId }, data });
  if (result.count === 0) {
    throw AppError.notFound("Client not found");
  }
  return prisma.client.findUnique({ where: { id }, include: { contacts: contactsOrder } });
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  const result = await prisma.client.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    throw AppError.notFound("Client not found");
  }
}