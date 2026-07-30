"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProjectOptionsResponse } from "../types/apiTypesSettings";

const PROJECT_OPTIONS_QUERY_KEY = ["projectOptions"] as const;

/**
 * Hook to fetch calendar-derived project options for digest exclusions
 */
export function useProjectOptions() {
  const query = useQuery<ProjectOptionsResponse>({
    queryKey: PROJECT_OPTIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/settings/project-options");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Error al obtener los proyectos del calendario"
        );
      }

      const json = await response.json();
      return json.data;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
