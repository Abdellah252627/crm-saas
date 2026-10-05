import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import { EMPTY_STATE_MESSAGE } from "../lib/chart";
import {
  CONTACT_TYPE_LABELS,
  type DashboardContact,
  type DashboardContactType,
  type NewClient,
} from "../types/dashboard";
import { CARD_SURFACE_CLASS, SECTION_TITLE_CLASS } from "../lib/ui";
import { ErrorState } from "./ErrorState";

interface RecentActivityProps {
  contacts: DashboardContact[];
  clients: NewClient[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

const CONTACT_BADGE_STYLES: Record<DashboardContactType, string> = {
  call: "bg-blue-50 text-blue-700",
  email: "bg-amber-50 text-amber-700",
  meeting: "bg-emerald-50 text-emerald-700",
};

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3">
          <span className="h-3 w-1/3 rounded bg-gray-100" />
          <span className="h-3 w-1/4 rounded bg-gray-100" />
          <span className="h-3 w-1/5 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}

function clientLinkParams(clientId: string): string {
  return `/clients?clientId=${encodeURIComponent(clientId)}`;
}

function ContactsTable({
  contacts,
  isLoading,
  isError,
  error,
  onRetry,
}: RecentActivityProps) {
  return (
    <section className={`${CARD_SURFACE_CLASS} flex-col overflow-hidden`}>
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className={SECTION_TITLE_CLASS}>آخر التواصلات</h2>
      </header>

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : isError ? (
        <div className="p-4">
          <ErrorState
            message="تعذّر جلب آخر التواصلات"
            error={error}
            onRetry={() => onRetry?.()}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-2 text-right">العميل</th>
                <th scope="col" className="px-4 py-2 text-right">نوع التواصل</th>
                <th scope="col" className="px-4 py-2 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.length === 0 ? (
                <EmptyRow colSpan={3} message={EMPTY_STATE_MESSAGE} />
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link
                        to={clientLinkParams(contact.clientId)}
                        className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                      >
                        {contact.clientName}
                      </Link>
                      {contact.notes !== undefined && contact.notes !== "" ? (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {contact.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTACT_BADGE_STYLES[contact.type]}`}
                      >
                        {CONTACT_TYPE_LABELS[contact.type]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                      {formatDate(contact.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ClientsTable({
  clients,
  isLoading,
  isError,
  error,
  onRetry,
}: RecentActivityProps) {
  return (
    <section className={`${CARD_SURFACE_CLASS} flex-col overflow-hidden`}>
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className={SECTION_TITLE_CLASS}>آخر العملاء</h2>
      </header>

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : isError ? (
        <div className="p-4">
          <ErrorState
            message="تعذّر جلب آخر العملاء"
            error={error}
            onRetry={() => onRetry?.()}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-2 text-right">العميل</th>
                <th scope="col" className="px-4 py-2 text-right">الشركة</th>
                <th scope="col" className="px-4 py-2 text-right">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.length === 0 ? (
                <EmptyRow colSpan={3} message={EMPTY_STATE_MESSAGE} />
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link
                        to={clientLinkParams(client.id)}
                        className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {client.company === "" ? "—" : client.company}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                      {formatDate(client.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Two compact tables: the latest logged contacts and the newest clients. */
export function RecentActivity(props: RecentActivityProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ContactsTable {...props} />
      <ClientsTable {...props} />
    </div>
  );
}