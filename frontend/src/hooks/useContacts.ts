import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createContact,
  deleteContact,
  getClientContacts,
  type CreateContactInput,
} from "../api/contacts";
import { DASHBOARD_QUERY_KEY } from "./useDashboard";

export const CONTACTS_QUERY_KEY = "contacts";

/** The dashboard's recent-contacts table is fed by the same rows, so refetch it. */
function invalidateContactViews(queryClient: QueryClient, clientId: string): void {
  void queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY, clientId] });
  void queryClient.invalidateQueries({ queryKey: [DASHBOARD_QUERY_KEY] });
}

export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, clientId],
    queryFn: () => getClientContacts(clientId),
  });
}

export function useCreateContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactInput) => createContact(clientId, data),
    onSettled: () => {
      invalidateContactViews(queryClient, clientId);
    },
  });
}

export function useDeleteContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteContact(clientId, contactId),
    onSettled: () => {
      invalidateContactViews(queryClient, clientId);
    },
  });
}
