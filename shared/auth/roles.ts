/**
 * Role constants
 */
export const ROLES = {
  GUEST: "guest",
  OWNER: "owner",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
