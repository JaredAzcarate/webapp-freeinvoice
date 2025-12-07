import { getDatabasePool } from "../connection";

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: Date;
}

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM permissions ORDER BY resource, action";
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get permission by ID
 */
export async function getPermissionById(
  id: number
): Promise<Permission | null> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM permissions WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get permission by name
 */
export async function getPermissionByName(
  name: string
): Promise<Permission | null> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM permissions WHERE name = $1";
  const result = await pool.query(query, [name]);
  return result.rows[0] || null;
}

/**
 * Get permissions by resource
 */
export async function getPermissionsByResource(
  resource: string
): Promise<Permission[]> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM permissions WHERE resource = $1 ORDER BY action";
  const result = await pool.query(query, [resource]);
  return result.rows;
}

