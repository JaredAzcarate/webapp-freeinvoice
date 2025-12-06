"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "../types/apiTypesAuth";

/**
 * Hook to change user password
 */
export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar contraseña");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
