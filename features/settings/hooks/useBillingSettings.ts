"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BillingSettingsResponse,
  UpdateBillingSettingsRequest,
} from "../types/apiTypesSettings";

const BILLING_SETTINGS_QUERY_KEY = ["billingSettings"] as const;

/**
 * Hook to fetch and update billing settings (hourly rate, digest email, excluded projects)
 */
export function useBillingSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<BillingSettingsResponse>({
    queryKey: BILLING_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/settings/billing");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Error al obtener la configuración de facturación"
        );
      }

      const json = await response.json();
      return json.data;
    },
  });

  const mutation = useMutation<
    BillingSettingsResponse,
    Error,
    UpdateBillingSettingsRequest
  >({
    mutationFn: async (data) => {
      const response = await fetch("/api/settings/billing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Error al actualizar la configuración de facturación"
        );
      }

      const json = await response.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_SETTINGS_QUERY_KEY });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateBillingSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
