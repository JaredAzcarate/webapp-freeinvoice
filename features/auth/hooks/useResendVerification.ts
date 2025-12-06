"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ResendVerificationRequest,
  ResendVerificationResponse,
} from "../types/apiTypesAuth";

/**
 * Hook to resend verification email
 */
export function useResendVerification() {
  return useMutation<
    ResendVerificationResponse,
    Error,
    ResendVerificationRequest
  >({
    mutationFn: async (data: ResendVerificationRequest) => {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al reenviar email");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
