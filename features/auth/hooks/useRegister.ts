"use client";

import { useMutation } from "@tanstack/react-query";
import { RegisterRequest, RegisterResponse } from "../types/apiTypesAuth";

/**
 * Hook to register a new user
 */
export function useRegister() {
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (data: RegisterRequest) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar usuario");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
