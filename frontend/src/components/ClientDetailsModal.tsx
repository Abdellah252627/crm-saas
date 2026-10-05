import { useEffect } from "react";
import { ContactsPanel } from "./ContactsPanel";
import { Button } from "./ui/Button";
import { STAGE_LABELS, type Client } from "../types/client";

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
}

export function ClientDetailsModal({
  client,
  onClose,
  onEdit,
}: ClientDetailsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-gray-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={`تفاصيل العميل ${client.name}`}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
            <p className="text-sm text-gray-500">
              {client.company ?? "—"}
              {client.city !== null ? ` · ${client.city}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {STAGE_LABELS[client.stage]}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-gray-500">البريد الإلكتروني</dt>
            <dd className="text-gray-800">{client.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">الهاتف</dt>
            <dd className="text-gray-800">
              {client.phone !== null ? (
                <span dir="ltr">{client.phone}</span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <ContactsPanel client={client} />
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onEdit}>
            تعديل بيانات العميل
          </Button>
        </div>
      </div>
    </div>
  );
}
