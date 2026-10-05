import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Client } from "../types/client";
import { Button } from "./ui/Button";

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
}

export function ClientCard({ client, onEdit }: ClientCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: client.id,
      data: { stage: client.stage },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
      }}
      {...listeners}
      {...attributes}
      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {client.name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {client.company ?? "—"}
          </p>
          {client.city !== null ? (
            <p className="mt-1 truncate text-xs text-gray-400">
              {client.city}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          onClick={onEdit}
          onPointerDown={(event) => event.stopPropagation()}
          className="shrink-0 px-2 py-1 text-xs"
        >
          تعديل
        </Button>
      </div>
    </div>
  );
}
