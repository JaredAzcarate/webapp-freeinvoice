"use client";

import { useQuery } from "@tanstack/react-query";
import { LoginMethodsResponse } from "../types/apiTypesAuth";

/**
 * Hook to get user login methods
 */
export function useLoginMethods() {
  return useQuery<LoginMethodsResponse>({
    queryKey: ["loginMethods"],
    queryFn: async () => {
      const response = await fetch("/api/auth/login-methods");

      if (!response.ok) {
        throw new Error("Error al obtener métodos de login");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
