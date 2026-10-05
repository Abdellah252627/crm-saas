import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../api/clients";
import { DASHBOARD_QUERY_KEY } from "./useDashboard";
import type {
  Client,
  ClientFilters,
  CreateClientInput,
  PaginatedClients,
  UpdateClientInput,
} from "../types/client";

export const CLIENTS_QUERY_KEY = "clients";

type ClientsSnapshot = Array<
  [queryKey: readonly unknown[], data: PaginatedClients | undefined]
>;

function matchesFilters(
  client: Client,
  filters: ClientFilters | undefined,
): boolean {
  if (filters === undefined) {
    return true;
  }
  if (filters.stage !== undefined && filters.stage !== client.stage) {
    return false;
  }
  if (filters.search !== undefined && filters.search.trim() !== "") {
    const needle = filters.search.trim().toLowerCase();
    const haystack = `${client.name} ${client.company ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  return true;
}

function snapshotClients(queryClient: QueryClient): ClientsSnapshot {
  return queryClient.getQueriesData<PaginatedClients>({
    queryKey: [CLIENTS_QUERY_KEY],
  });
}

function restoreSnapshot(
  queryClient: QueryClient,
  snapshot: ClientsSnapshot,
): void {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

/** Keeps the Clients list and the dashboard KPI/chart data from drifting apart. */
function invalidateClientViews(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
  void queryClient.invalidateQueries({ queryKey: [DASHBOARD_QUERY_KEY] });
}

export function useClients(params: ClientFilters = {}) {
  return useQuery({
    queryKey: [CLIENTS_QUERY_KEY, params],
    queryFn: () => getClients(params),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientInput) => createClient(data),
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({
        queryKey: [CLIENTS_QUERY_KEY],
      });
      const snapshot = snapshotClients(queryClient);
      const optimisticClient: Client = {
        id: `temp-${Date.now()}`,
        name: newClient.name,
        company: newClient.company ?? null,
        email: newClient.email ?? null,
        phone: newClient.phone ?? null,
        city: newClient.city ?? null,
        stage: newClient.stage ?? "LEAD",
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      snapshot.forEach(([queryKey]) => {
        const filters =
          (queryKey[1] as ClientFilters | undefined) ?? {};
        queryClient.setQueryData<PaginatedClients>(
          queryKey,
          (current) => {
            if (
              current === undefined ||
              current.page !== 1 ||
              !matchesFilters(optimisticClient, filters)
            ) {
              return current;
            }
            return {
              ...current,
              clients: [optimisticClient, ...current.clients],
              count: current.count + 1,
              total: current.total + 1,
              totalPages: Math.max(
                Math.ceil((current.total + 1) / current.limit),
                current.totalPages,
              ),
            };
          },
        );
      });
      return { snapshot };
    },
    onError: (_error, _newClient, context) => {
      if (context !== undefined) {
        restoreSnapshot(queryClient, context.snapshot);
      }
    },
    onSettled: () => {
      invalidateClientViews(queryClient);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClientInput;
    }) => updateClient(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: [CLIENTS_QUERY_KEY],
      });
      const snapshot = snapshotClients(queryClient);
      snapshot.forEach(([queryKey]) => {
        queryClient.setQueryData<PaginatedClients>(
          queryKey,
          (current) =>
            current === undefined
              ? current
              : {
                  ...current,
                  clients: current.clients.map((client) =>
                    client.id === id
                      ? { ...client, ...data }
                      : client,
                  ),
                },
        );
      });
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context !== undefined) {
        restoreSnapshot(queryClient, context.snapshot);
      }
    },
    onSettled: () => {
      invalidateClientViews(queryClient);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [CLIENTS_QUERY_KEY],
      });
      const snapshot = snapshotClients(queryClient);
      snapshot.forEach(([queryKey]) => {
        queryClient.setQueryData<PaginatedClients>(
          queryKey,
          (current) =>
            current === undefined
              ? current
              : {
                  ...current,
                  clients: current.clients.filter(
                    (client) => client.id !== id,
                  ),
                  count: Math.max(current.count - 1, 0),
                  total: Math.max(current.total - 1, 0),
                },
        );
      });
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      if (context !== undefined) {
        restoreSnapshot(queryClient, context.snapshot);
      }
    },
    onSettled: () => {
      invalidateClientViews(queryClient);
    },
  });
}
