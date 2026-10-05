export type Stage = "LEAD" | "CONTACTED" | "PROPOSAL" | "WON" | "LOST";

export type ContactType = "CALL" | "EMAIL" | "MEETING";

export interface Contact {
  id: string;
  type: ContactType;
  note: string | null;
  date: string;
  clientId: string;
  userId: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  stage: Stage;
  userId: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
}

export interface ClientFilters {
  stage?: Stage;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateClientInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  stage?: Stage;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface PaginatedClients {
  clients: Client[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type StageStats = Record<Stage, number>;

export const STAGES: Stage[] = [
  "LEAD",
  "CONTACTED",
  "PROPOSAL",
  "WON",
  "LOST",
];

export const STAGE_LABELS: Record<Stage, string> = {
  LEAD: "عميل محتمل",
  CONTACTED: "تم التواصل",
  PROPOSAL: "عرض سعر",
  WON: "فائز",
  LOST: "خاسر",
};

/** Chart palette, kept in step with the stage badges used in the Clients table. */
export const STAGE_COLORS: Record<Stage, string> = {
  LEAD: "#9ca3af",
  CONTACTED: "#3b82f6",
  PROPOSAL: "#f59e0b",
  WON: "#10b981",
  LOST: "#ef4444",
};
