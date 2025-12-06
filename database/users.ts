import { getDatabasePool } from "./connection";

export interface User {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createOrUpdateUser(
  email: string,
  name?: string,
  image?: string,
  googleId?: string
): Promise<User> {
  const pool = getDatabasePool();

  const query = `
    INSERT INTO users (email, name, image, google_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) 
    DO UPDATE SET
      name = COALESCE(EXCLUDED.name, users.name),
      image = COALESCE(EXCLUDED.image, users.image),
      google_id = COALESCE(EXCLUDED.google_id, users.google_id),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(query, [
    email,
    name || null,
    image || null,
    googleId || null,
  ]);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getDatabasePool();

  const query = "SELECT * FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);

  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const pool = getDatabasePool();

  const query = "SELECT * FROM users WHERE id = $1";
  const result = await pool.query(query, [id]);

  return result.rows[0] || null;
}

export async function getUserByGoogleId(
  googleId: string
): Promise<User | null> {
  const pool = getDatabasePool();

  const query = "SELECT * FROM users WHERE google_id = $1";
  const result = await pool.query(query, [googleId]);

  return result.rows[0] || null;
}
