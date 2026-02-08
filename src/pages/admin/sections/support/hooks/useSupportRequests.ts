/**
 * Hook for fetching support requests
 */
import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "../../../queries/keys";
import { fetchSupportRequests } from "../../../queries/supportRequests.query";
import type { SupportStatusFilter } from "../../../types";

export function useSupportRequests(filter: SupportStatusFilter = 'all') {
  return useQuery({
    queryKey: adminKeys.support(filter),
    queryFn: () => fetchSupportRequests(filter),
    staleTime: 10_000, // 10 seconds
  });
}
