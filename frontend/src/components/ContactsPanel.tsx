import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../api/axios";
import { ErrorState } from "./ErrorState";
import { Button } from "./ui/Button";
import {
  useClientContacts,
  useCreateContact,
  useDeleteContact,
} from "../hooks/useContacts";
import { formatDate } from "../lib/format";
import {
  CARD_SURFACE_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  MUTED_LABEL_CLASS,
  SECTION_TITLE_CLASS,
} from "../lib/ui";
import type { Client, ContactType } from "../types/client";

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "CALL", label: "مكالمة" },
  { value: "EMAIL", label: "بريد إلكتروني" },
  { value: "MEETING", label: "اجتماع" },
];

const CONTACT_TYPE_BADGES: Record<ContactType, string> = {
  CALL: "bg-blue-100 text-blue-700",
  EMAIL: "bg-amber-100 text-amber-700",
  MEETING: "bg-emerald-100 text-emerald-700",
};

function labelForType(type: ContactType): string {
  return CONTACT_TYPES.find((entry) => entry.value === type)?.label ?? type;
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO instant. */
function nowForInput(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface ContactsPanelProps {
  client: Client;
}

export function ContactsPanel({ client }: ContactsPanelProps) {
  const [type, setType] = useState<ContactType>("CALL");
  const [date, setDate] = useState<string>(nowForInput);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const contactsQuery = useClientContacts(client.id);
  const createContactMutation = useCreateContact(client.id);
  const { mutateAsync: deleteContactMutation } = useDeleteContact(client.id);

  const contacts = contactsQuery.data ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    try {
      await createContactMutation.mutateAsync({ type, date, note });
      setNote("");
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    }
  }

  async function handleDelete(contactId: string) {
    setDeletingId(contactId);
    try {
      await deleteContactMutation(contactId);
    } catch {
      // The mutation's toast already surfaces the reason; keep the row visible.
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={`${CARD_SURFACE_CLASS} overflow-hidden`}>
      <header className="border-b border-gray-100 px-4 py-3">
        <h3 className={SECTION_TITLE_CLASS}>
          سجل التواصلات
          {contactsQuery.data !== undefined ? (
            <span className={MUTED_LABEL_CLASS}> ({contacts.length})</span>
          ) : null}
        </h3>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-b border-gray-100 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`contact-type-${client.id}`}
              className={LABEL_CLASS}
            >
              نوع التواصل
            </label>
            <select
              id={`contact-type-${client.id}`}
              value={type}
              onChange={(event) => setType(event.target.value as ContactType)}
              className={FIELD_CLASS}
            >
              {CONTACT_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`contact-date-${client.id}`}
              className={LABEL_CLASS}
            >
              التاريخ والوقت
            </label>
            <input
              id={`contact-date-${client.id}`}
              type="datetime-local"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor={`contact-note-${client.id}`}
            className={LABEL_CLASS}
          >
            ملاحظات
          </label>
          <textarea
            id={`contact-note-${client.id}`}
            rows={2}
            value={note}
            maxLength={2000}
            placeholder="اختياري — ملخّص ما دار في هذا التواصل"
            onChange={(event) => setNote(event.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        {formError !== null ? (
          <p className="text-xs text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        <Button
          type="submit"
          isLoading={createContactMutation.isPending}
          className="w-full"
        >
          {createContactMutation.isPending ? "جارٍ التسجيل…" : "تسجيل تواصل"}
        </Button>
      </form>

      {contactsQuery.isLoading ? (
        <div className="space-y-2 p-4" role="status" aria-label="جارٍ جلب التواصلات">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : contactsQuery.isError ? (
        <div className="p-4">
          <ErrorState
            message="تعذّر جلب سجل التواصلات"
            error={contactsQuery.error}
            onRetry={() => void contactsQuery.refetch()}
          />
        </div>
      ) : contacts.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-400">
          لا يوجد تواصلات مسجّلة بعد
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTACT_TYPE_BADGES[contact.type]}`}
                  >
                    {labelForType(contact.type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(contact.date)}
                  </span>
                </div>
                {contact.note !== null && contact.note !== "" ? (
                  <p className="mt-1 text-sm text-gray-700">{contact.note}</p>
                ) : null}
              </div>
              <Button
                variant="secondary"
                isLoading={deletingId === contact.id}
                onClick={() => void handleDelete(contact.id)}
                className="shrink-0 px-3 py-1 text-xs"
              >
                حذف
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
