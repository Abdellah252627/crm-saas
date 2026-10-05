import { apiClient } from "./axios";
import { toast } from "../lib/toast";
import type {
  Client,
  ClientFilters,
  CreateClientInput,
  PaginatedClients,
  UpdateClientInput,
} from "../types/client";

interface ClientResponse {
  client: Client;
}

export async function getClients(
  params: ClientFilters = {},
): Promise<PaginatedClients> {
  const response = await apiClient.get<PaginatedClients>(
    "/api/clients",
    { params },
  );
  return response.data;
}

export async function getClientById(id: string): Promise<Client> {
  const response = await apiClient.get<ClientResponse>(
    `/api/clients/${id}`,
  );
  return response.data.client;
}

export async function createClient(
  data: CreateClientInput,
): Promise<Client> {
  return toast.promise(
    apiClient
      .post<ClientResponse>("/api/clients", data)
      .then((response) => response.data.client),
    {
      loading: "جاري إضافة العميل…",
      success: "تمت إضافة العميل بنجاح",
      error: "فشل إضافة العميل",
    },
  );
}

export async function updateClient(
  id: string,
  data: UpdateClientInput,
): Promise<Client> {
  return toast.promise(
    apiClient
      .patch<ClientResponse>(`/api/clients/${id}`, data)
      .then((response) => response.data.client),
    {
      loading: "جارٍ حفظ التعديلات…",
      success: "تم حفظ التعديلات بنجاح",
      error: "فشل حفظ التعديلات",
    },
  );
}

export async function deleteClient(id: string): Promise<void> {
  return toast.promise(
    apiClient.delete(`/api/clients/${id}`).then(() => undefined),
    {
      loading: "جارٍ حذف العميل…",
      success: "تم حذف العميل بنجاح",
      error: "فشل حذف العميل",
    },
  );
}
