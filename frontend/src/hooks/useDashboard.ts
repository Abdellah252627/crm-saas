import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_DAILY_RANGE,
  DEFAULT_NEW_CLIENTS_LIMIT,
  DEFAULT_RECENT_CONTACTS_LIMIT,
  getClientsByDay,
  getDashboardStats,
  getNewClients,
  getRecentContacts,
} from "../api/dashboard";

/** Shared prefix so client mutations can invalidate every dashboard query at once. */
export const DASHBOARD_QUERY_KEY = "dashboard";

export const DASHBOARD_REFETCH_INTERVAL_MS = 300_000;

export function useDashboardStats() {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, "stats"],
    queryFn: getDashboardStats,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
  });
}

export function useClientsByDay(lastDays: number = DEFAULT_DAILY_RANGE) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, "clientsByDay", lastDays],
    queryFn: () => getClientsByDay(lastDays),
  });
}

export function useRecentContacts(limit: number = DEFAULT_RECENT_CONTACTS_LIMIT) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, "recentContacts", limit],
    queryFn: () => getRecentContacts(limit),
  });
}

export function useNewClients(limit: number = DEFAULT_NEW_CLIENTS_LIMIT) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, "newClients", limit],
    queryFn: () => getNewClients(limit),
  });
}