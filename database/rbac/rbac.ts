import { getDatabasePool } from "../connection";
import { getPermissionByName } from "./permissions";

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  const pool = getDatabasePool();

  const permission = await getPermissionByName(permissionName);
  if (!permission) {
    return false;
  }

  const query = `
    SELECT COUNT(*) as count
    FROM user_roles ur
    INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = $1 AND rp.permission_id = $2
  `;

  const result = await pool.query(query, [userId, permission.id]);
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Get all permissions for a user (through their roles)
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const pool = getDatabasePool();

  const query = `
    SELECT DISTINCT p.name
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY p.name
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.map((row) => row.name);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: number,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionNames.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: number,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionNames.every((perm) => userPermissions.includes(perm));
}

