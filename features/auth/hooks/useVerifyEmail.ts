"use client";

import { useMutation } from "@tanstack/react-query";
import { VerifyEmailRequest, VerifyEmailResponse } from "../types/apiTypesAuth";

/**
 * Hook to verify user email
 */
export function useVerifyEmail() {
  return useMutation<VerifyEmailResponse, Error, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al verificar email");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
