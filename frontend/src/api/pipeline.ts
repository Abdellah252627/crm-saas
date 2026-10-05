import { apiClient } from "./axios";
import { toast } from "../lib/toast";
import type {
  Client,
  ClientFilters,
  PaginatedClients,
  Stage,
  StageStats,
} from "../types/client";
import { STAGE_LABELS } from "../types/client";

interface ClientResponse {
  client: Client;
}

export async function getClientsByStage(
  stage: Stage,
  params: Omit<ClientFilters, "stage"> = {},
): Promise<PaginatedClients> {
  const response = await apiClient.get<PaginatedClients>("/api/clients", {
    params: { ...params, stage },
  });
  return response.data;
}

export async function moveClientToStage(
  clientId: string,
  newStage: Stage,
): Promise<Client> {
  return toast.promise(
    apiClient
      .patch<ClientResponse>(`/api/clients/${clientId}`, {
        stage: newStage,
      })
      .then((response) => response.data.client),
    {
      loading: "جارٍ نقل العميل…",
      success: `نُقل العميل إلى ${STAGE_LABELS[newStage]}`,
      error: "فشل نقل العميل",
    },
  );
}

export async function getStageStats(): Promise<StageStats> {
  const response = await apiClient.get<{ byStage: StageStats }>(
    "/api/dashboard",
  );
  return response.data.byStage;
}
