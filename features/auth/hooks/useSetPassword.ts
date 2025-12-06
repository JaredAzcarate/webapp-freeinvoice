"use client";

import { useMutation } from "@tanstack/react-query";
import { SetPasswordRequest, SetPasswordResponse } from "../types/apiTypesAuth";

/**
 * Hook to set password for users without password (e.g., Google-only users)
 */
export function useSetPassword() {
  return useMutation<SetPasswordResponse, Error, SetPasswordRequest>({
    mutationFn: async (data: SetPasswordRequest) => {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al establecer contraseña");
      }

      const json = await response.json();
      return json.data;
    },
  });
}
