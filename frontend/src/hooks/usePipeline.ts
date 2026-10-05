import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getClientsByStage,
  getStageStats,
  moveClientToStage,
} from "../api/pipeline";
import { CLIENTS_QUERY_KEY } from "./useClients";
import { DASHBOARD_QUERY_KEY } from "./useDashboard";
import type {
  Client,
  PaginatedClients,
  Stage,
  StageStats,
} from "../types/client";

const PIPELINE_STATS_QUERY_KEY = "pipelineStats";
const PIPELINE_PAGE_SIZE = 100;

export function useStageClients(stage: Stage) {
  return useQuery({
    queryKey: [CLIENTS_QUERY_KEY, { stage, limit: PIPELINE_PAGE_SIZE }],
    queryFn: () =>
      getClientsByStage(stage, { limit: PIPELINE_PAGE_SIZE }),
  });
}

export function useStageStats() {
  return useQuery({
    queryKey: [PIPELINE_STATS_QUERY_KEY],
    queryFn: getStageStats,
  });
}

export interface MoveToStageInput {
  clientId: string;
  fromStage: Stage;
  newStage: Stage;
}

export function useMoveToStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, newStage }: MoveToStageInput) =>
      moveClientToStage(clientId, newStage),
    onMutate: async ({ clientId, fromStage, newStage }) => {
      await queryClient.cancelQueries({
        queryKey: [CLIENTS_QUERY_KEY],
      });
      const stageSnapshot =
        queryClient.getQueriesData<PaginatedClients>({
          queryKey: [CLIENTS_QUERY_KEY],
        });
      const statsSnapshot = queryClient.getQueryData<StageStats>([
        PIPELINE_STATS_QUERY_KEY,
      ]);

      let movedClient: Client | undefined;
      stageSnapshot.forEach(([, data]) => {
        const found = data?.clients.find(
          (client) => client.id === clientId,
        );
        if (found !== undefined) {
          movedClient = found;
        }
      });

      stageSnapshot.forEach(([queryKey]) => {
        queryClient.setQueryData<PaginatedClients>(
          queryKey,
          (current) =>
            current === undefined
              ? current
              : {
                  ...current,
                  clients: current.clients.filter(
                    (client) => client.id !== clientId,
                  ),
                  count: Math.max(current.count - 1, 0),
                  total: Math.max(current.total - 1, 0),
                },
        );
      });

      if (movedClient !== undefined) {
        const optimisticClient: Client = {
          ...movedClient,
          stage: newStage,
        };
        const targetKey = [
          CLIENTS_QUERY_KEY,
          { stage: newStage, limit: PIPELINE_PAGE_SIZE },
        ];
        queryClient.setQueryData<PaginatedClients>(
          targetKey,
          (current) =>
            current === undefined
              ? {
                  clients: [optimisticClient],
                  count: 1,
                  total: 1,
                  page: 1,
                  limit: PIPELINE_PAGE_SIZE,
                  totalPages: 1,
                }
              : {
                  ...current,
                  clients: [optimisticClient, ...current.clients],
                  count: current.count + 1,
                  total: current.total + 1,
                  totalPages: Math.max(
                    Math.ceil((current.total + 1) / current.limit),
                    current.totalPages,
                  ),
                },
        );
      }

      queryClient.setQueryData<StageStats>(
        [PIPELINE_STATS_QUERY_KEY],
        (current) =>
          current === undefined
            ? current
            : {
                ...current,
                [fromStage]: Math.max(current[fromStage] - 1, 0),
                [newStage]: (current[newStage] ?? 0) + 1,
              },
      );

      return { stageSnapshot, statsSnapshot };
    },
    onError: (_error, _input, context) => {
      if (context === undefined) {
        return;
      }
      context.stageSnapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      queryClient.setQueryData(
        [PIPELINE_STATS_QUERY_KEY],
        context.statsSnapshot,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: [CLIENTS_QUERY_KEY],
      });
      void queryClient.invalidateQueries({
        queryKey: [PIPELINE_STATS_QUERY_KEY],
      });
      // A stage move changes win rate, conversion rate and active deals.
      void queryClient.invalidateQueries({
        queryKey: [DASHBOARD_QUERY_KEY],
      });
    },
  });
}
