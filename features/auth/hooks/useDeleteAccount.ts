"use client";

import { useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { DeleteAccountResponse } from "../types/apiTypesAuth";

/**
 * Hook to delete user account
 */
export function useDeleteAccount() {
  return useMutation<DeleteAccountResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar cuenta");
      }

      const json = await response.json();
      return json.data;
    },
    onSuccess: async () => {
      await signOut({ callbackUrl: "/" });
    },
  });
}
