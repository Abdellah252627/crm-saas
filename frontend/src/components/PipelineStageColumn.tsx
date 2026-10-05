import { useDroppable } from "@dnd-kit/core";
import type { Client, Stage } from "../types/client";
import { STAGE_LABELS } from "../types/client";
import { ClientCard } from "./ClientCard";
import { Button } from "./ui/Button";
import { SECTION_TITLE_CLASS } from "../lib/ui";

interface PipelineStageColumnProps {
  stage: Stage;
  clients: Client[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEditClient: (client: Client) => void;
}

function SkeletonCards() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </div>
  );
}

export function PipelineStageColumn({
  stage,
  clients,
  isLoading,
  isError,
  onRetry,
  onEditClient,
}: PipelineStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={SECTION_TITLE_CLASS}>
          {STAGE_LABELS[stage]}
        </h2>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
          {isLoading ? "…" : clients.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-40 flex-1 space-y-2 rounded-2xl border p-2 transition-colors ${
          isOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-dashed border-gray-300 bg-gray-50/50"
        }`}
      >
        {isLoading ? (
          <SkeletonCards />
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
            <p className="text-xs text-red-600">
              تعذّر جلب العملاء
            </p>
            <Button
              variant="secondary"
              onClick={onRetry}
              className="px-3 py-1 text-xs"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-gray-400">
            لا يوجد عملاء في هذه المرحلة
          </p>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => onEditClient(client)}
            />
          ))
        )}
      </div>
    </div>
  );
}
