import { getDatabasePool } from "../connection";

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM roles ORDER BY name";
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get role by ID
 */
export async function getRoleById(id: number): Promise<Role | null> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM roles WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  const pool = getDatabasePool();
  const query = "SELECT * FROM roles WHERE name = $1";
  const result = await pool.query(query, [name]);
  return result.rows[0] || null;
}

