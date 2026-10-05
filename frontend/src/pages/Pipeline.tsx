import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { getApiErrorMessage } from "../api/axios";
import { ClientModal } from "../components/ClientModal";
import { PipelineStageColumn } from "../components/PipelineStageColumn";
import { Button } from "../components/ui/Button";
import {
  useMoveToStage,
  useStageClients,
  useStageStats,
} from "../hooks/usePipeline";
import {
  PAGE_CLASS,
  PAGE_HEADER_CLASS,
  PAGE_TITLE_CLASS,
} from "../lib/ui";
import {
  STAGES,
  type Client,
  type Stage,
} from "../types/client";

const PIPELINE_STAGES: Stage[] = [...STAGES];

function isStage(value: unknown): value is Stage {
  return (
    typeof value === "string" &&
    (STAGES as readonly string[]).includes(value)
  );
}

export function Pipeline() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(
    null,
  );
  const moveToStage = useMoveToStage();
  const {
    data: stats,
    isError: statsIsError,
    error: statsError,
    refetch: refetchStats,
  } = useStageStats();

  const lead = useStageClients("LEAD");
  const contacted = useStageClients("CONTACTED");
  const proposal = useStageClients("PROPOSAL");
  const won = useStageClients("WON");
  const lost = useStageClients("LOST");

  const queriesByStage: Record<
    Stage,
    ReturnType<typeof useStageClients>
  > = {
    LEAD: lead,
    CONTACTED: contacted,
    PROPOSAL: proposal,
    WON: won,
    LOST: lost,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null) {
      return;
    }
    const clientId = String(active.id);
    const fromStage = active.data.current?.stage;
    const newStage = over.id;
    if (
      !isStage(fromStage) ||
      !isStage(newStage) ||
      fromStage === newStage
    ) {
      return;
    }
    moveToStage.mutate({ clientId, fromStage, newStage });
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function stageView(stage: Stage) {
    const query = queriesByStage[stage];
    return {
      clients: query.data?.clients ?? [],
      isLoading: query.isLoading,
      isError: query.isError,
      retry: () => void query.refetch(),
    };
  }

  return (
    <div dir="rtl" className={PAGE_CLASS}>
      <div className={PAGE_HEADER_CLASS}>
        <h1 className={PAGE_TITLE_CLASS}>خط الأنابيب</h1>
        {statsIsError ? (
          <Button
            variant="secondary"
            onClick={() => void refetchStats()}
          >
            إعادة تحميل الإحصاءات
          </Button>
        ) : stats !== undefined ? (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              الإجمالي:{" "}
              <span className="font-semibold text-gray-900">
                {STAGES.reduce((sum, stage) => sum + stats[stage], 0)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              فائز: {stats.WON}
            </span>
          </div>
        ) : null}
      </div>

      {statsIsError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          تعذّر جلب إحصاءات المراحل: {getApiErrorMessage(statsError)}
        </p>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const view = stageView(stage);
            return (
              <PipelineStageColumn
                key={stage}
                stage={stage}
                clients={view.clients}
                isLoading={view.isLoading}
                isError={view.isError}
                onRetry={view.retry}
                onEditClient={openEditModal}
              />
            );
          })}
        </div>
      </DndContext>

      {modalOpen ? (
        <ClientModal
          client={editingClient}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
