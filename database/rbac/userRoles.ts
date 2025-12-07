import { getDatabasePool } from "../connection";
import { getRoleByName } from "./roles";

export interface UserRole {
  user_id: number;
  role_id: number;
  created_at: Date;
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: number,
  roleName: string
): Promise<boolean> {
  const pool = getDatabasePool();
  const role = await getRoleByName(roleName);

  if (!role) {
    return false;
  }

  const query = `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;

  const result = await pool.query(query, [userId, role.id]);
  return result.rowCount > 0;
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  userId: number,
  roleName: string
): Promise<boolean> {
  const pool = getDatabasePool();
  const role = await getRoleByName(roleName);

  if (!role) {
    return false;
  }

  const query = "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2";
  const result = await pool.query(query, [userId, role.id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  const pool = getDatabasePool();
  const query = `
    SELECT r.name
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows.map((row) => row.name);
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(
  userId: number,
  roleName: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

