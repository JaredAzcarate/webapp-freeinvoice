/**
 * Permission constants
 * Format: resource:action
 */
export const PERMISSIONS = {
  // Calendar
  CALENDAR_READ: "calendar:read",
  CALENDAR_CREATE: "calendar:create",
  CALENDAR_UPDATE: "calendar:update",
  CALENDAR_DELETE: "calendar:delete",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Auth
  AUTH_READ: "auth:read",
  AUTH_UPDATE: "auth:update",
  AUTH_DELETE: "auth:delete",

  // Users (for future use)
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
