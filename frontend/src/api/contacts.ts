import { apiClient } from "./axios";
import { toast } from "../lib/toast";
import type { Contact, ContactType } from "../types/client";

export interface CreateContactInput {
  type: ContactType;
  note?: string;
  /** Local `datetime-local` value; converted to ISO before hitting the wire. */
  date: string;
}

interface ContactsResponse {
  contacts: Contact[];
  count: number;
}

interface ContactResponse {
  contact: Contact;
}

function toPayload(data: CreateContactInput) {
  const note = data.note?.trim() ?? "";
  return {
    type: data.type,
    note: note === "" ? null : note,
    date: new Date(data.date).toISOString(),
  };
}

export async function getClientContacts(clientId: string): Promise<Contact[]> {
  const response = await apiClient.get<ContactsResponse>(
    `/api/clients/${clientId}/contacts`,
  );
  return response.data.contacts;
}

export async function createContact(
  clientId: string,
  data: CreateContactInput,
): Promise<Contact> {
  return toast.promise(
    apiClient
      .post<ContactResponse>(`/api/clients/${clientId}/contacts`, toPayload(data))
      .then((response) => response.data.contact),
    {
      loading: "جارٍ تسجيل التواصل…",
      success: "تم تسجيل التواصل بنجاح",
      error: "فشل تسجيل التواصل",
    },
  );
}

export async function deleteContact(
  clientId: string,
  contactId: string,
): Promise<void> {
  return toast.promise(
    apiClient
      .delete(`/api/clients/${clientId}/contacts/${contactId}`)
      .then(() => undefined),
    {
      loading: "جارٍ حذف التواصل…",
      success: "تم حذف التواصل",
      error: "فشل حذف التواصل",
    },
  );
}
