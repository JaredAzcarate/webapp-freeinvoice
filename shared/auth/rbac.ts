import { getUserPermissions, hasPermission } from "@/database/rbac/rbac";
import { getUserRoles } from "@/database/rbac/userRoles";
import { PERMISSIONS } from "./permissions";
import { ROLES } from "./roles";

/**
 * Check if user has a specific permission
 */
export async function checkPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  return hasPermission(userId, permission);
}

/**
 * Check if user has a specific role
 */
export async function checkRole(
  userId: number,
  role: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/**
 * Get all roles for a user
 */
export async function getRolesForUser(userId: number): Promise<string[]> {
  return getUserRoles(userId);
}

/**
 * Get all permissions for a user
 */
export async function getPermissionsForUser(userId: number): Promise<string[]> {
  return getUserPermissions(userId);
}

/**
 * Check if user is owner
 */
export async function isOwner(userId: number): Promise<boolean> {
  return checkRole(userId, ROLES.OWNER);
}

/**
 * Check if user is guest
 */
export async function isGuest(userId: number): Promise<boolean> {
  return checkRole(userId, ROLES.GUEST);
}

/**
 * Helper to check calendar permissions
 */
export const CalendarPermissions = {
  canRead: (userId: number) =>
    checkPermission(userId, PERMISSIONS.CALENDAR_READ),
  canCreate: (userId: number) =>
    checkPermission(userId, PERMISSIONS.CALENDAR_CREATE),
  canUpdate: (userId: number) =>
    checkPermission(userId, PERMISSIONS.CALENDAR_UPDATE),
  canDelete: (userId: number) =>
    checkPermission(userId, PERMISSIONS.CALENDAR_DELETE),
};

/**
 * Helper to check settings permissions
 */
export const SettingsPermissions = {
  canRead: (userId: number) =>
    checkPermission(userId, PERMISSIONS.SETTINGS_READ),
  canUpdate: (userId: number) =>
    checkPermission(userId, PERMISSIONS.SETTINGS_UPDATE),
};

/**
 * Helper to check auth permissions
 */
export const AuthPermissions = {
  canRead: (userId: number) => checkPermission(userId, PERMISSIONS.AUTH_READ),
  canUpdate: (userId: number) =>
    checkPermission(userId, PERMISSIONS.AUTH_UPDATE),
  canDelete: (userId: number) =>
    checkPermission(userId, PERMISSIONS.AUTH_DELETE),
};
