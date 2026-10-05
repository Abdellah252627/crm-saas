import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/axios";
import { ClientDetailsModal } from "../components/ClientDetailsModal";
import { ClientModal } from "../components/ClientModal";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Button } from "../components/ui/Button";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useClients, useDeleteClient } from "../hooks/useClients";
import { formatDate } from "../lib/format";
import {
  CARD_SURFACE_CLASS,
  FIELD_CLASS,
  FIELD_ERROR_CLASS,
  PAGE_CLASS,
  PAGE_HEADER_CLASS,
  PAGE_TITLE_CLASS,
} from "../lib/ui";
import {
  STAGES,
  STAGE_LABELS,
  type Client,
  type Stage,
} from "../types/client";

const STAGE_BADGE_STYLES: Record<Stage, string> = {
  LEAD: "bg-gray-100 text-gray-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
};

export function Clients() {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "">("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailsClientId, setDetailsClientId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  const search = useDebouncedValue(searchInput, 300);
  // Deep link from the dashboard: /clients?clientId=…
  const highlightedClientId = searchParams.get("clientId");

  // Changing a filter invalidates the current page number. Resetting during the
  // render keeps it in sync without the extra pass an effect would cost.
  const filterSignature = `${search}|${stageFilter}`;
  const [lastFilterSignature, setLastFilterSignature] = useState(filterSignature);
  if (filterSignature !== lastFilterSignature) {
    setLastFilterSignature(filterSignature);
    setPage(1);
  }

  const filters = useMemo(() => {
    const result: { stage?: Stage; search?: string; page: number } = {
      page,
    };
    if (stageFilter !== "") {
      result.stage = stageFilter;
    }
    if (search.trim() !== "") {
      result.search = search.trim();
    }
    return result;
  }, [stageFilter, search, page]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useClients(filters);
  const { mutateAsync: deleteClientMutation } = useDeleteClient();

  useEffect(() => {
    highlightedRowRef.current?.scrollIntoView({ block: "center" });
  }, [data, highlightedClientId]);

  function openAddModal() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function openEditFromDetails() {
    const target = detailsClient;
    if (target === null) {
      return;
    }
    setEditingClient(target);
    setModalOpen(true);
  }

  const clients = data?.clients ?? [];
  // Derived from the query cache rather than copied into state, so an edit made
  // in the modal flows straight through to the open details view.
  const detailsClient =
    clients.find((client) => client.id === detailsClientId) ?? null;

  async function handleDelete(client: Client) {
    if (!window.confirm(`هل تريد حذف العميل "${client.name}"؟`)) {
      return;
    }
    setDeleteError(null);
    setDeletingId(client.id);
    try {
      await deleteClientMutation(client.id);
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div dir="rtl" className={PAGE_CLASS}>
      <div className={PAGE_HEADER_CLASS}>
        <h1 className={PAGE_TITLE_CLASS}>العملاء</h1>
        <Button onClick={openAddModal}>إضافة عميل</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="ابحث بالاسم أو الشركة…"
          className={`min-w-64 flex-1 ${FIELD_CLASS}`}
        />
        <select
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value as Stage | "")}
          className={FIELD_CLASS}
        >
          <option value="">كل المراحل</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        {isFetching && !isLoading ? (
          <span className="text-xs text-gray-400">جارٍ التحديث…</span>
        ) : null}
      </div>

      {deleteError !== null ? (
        <div className={FIELD_ERROR_CLASS} role="alert">
          {deleteError}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState message="جارٍ جلب العملاء…" />
      ) : isError ? (
        <ErrorState
          message="تعذّر جلب العملاء"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            لا يوجد عملاء
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {searchInput === "" && stageFilter === ""
              ? "ابدأ بإضافة عميلك الأول"
              : "لا توجد نتائج مطابقة لبحثك، جرّب تعديل البحث أو المرحلة"}
          </p>
          <Button onClick={openAddModal} className="mt-4">
            إضافة عميل
          </Button>
        </div>
      ) : (
        <div className={`${CARD_SURFACE_CLASS} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-right text-xs font-medium text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">الاسم</th>
                <th scope="col" className="px-4 py-3">الشركة</th>
                <th scope="col" className="px-4 py-3">المرحلة</th>
                <th scope="col" className="px-4 py-3">المدينة</th>
                <th scope="col" className="px-4 py-3">تاريخ الإضافة</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  ref={client.id === highlightedClientId ? highlightedRowRef : undefined}
                  className={`transition-colors hover:bg-gray-50 ${
                    client.id === highlightedClientId
                      ? "bg-indigo-50 hover:bg-indigo-50"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {client.name}
                    {client.id === highlightedClientId ? (
                      <span className="ms-2 text-xs font-normal text-indigo-600">
                        العميل المحدد
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.company ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_STYLES[client.stage]}`}
                    >
                      {STAGE_LABELS[client.stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.city ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setDetailsClientId(client.id)}
                      >
                        التفاصيل
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openEditModal(client)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="danger"
                        isLoading={deletingId === client.id}
                        onClick={() => void handleDelete(client)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data !== undefined && data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            السابق
          </Button>
          <span>
            صفحة {page} من {data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            التالي
          </Button>
        </div>
      ) : null}

      {detailsClient !== null ? (
        <ClientDetailsModal
          client={detailsClient}
          onClose={() => setDetailsClientId(null)}
          onEdit={openEditFromDetails}
        />
      ) : null}

      {modalOpen ? (
        <ClientModal
          client={editingClient}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
