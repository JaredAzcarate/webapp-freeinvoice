import { ROLES } from "@/shared/auth/roles";
import bcrypt from "bcrypt";
import { getDatabasePool } from "../connection";
import { assignRoleToUser } from "../rbac/userRoles";

export interface User {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string | null;
  password_hash: string | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoginMethods {
  hasPassword: boolean;
  hasGoogle: boolean;
}

export async function createOrUpdateUser(
  email: string,
  name?: string,
  image?: string,
  googleId?: string
): Promise<User> {
  const pool = getDatabasePool();

  // Check if user exists before insert
  const existingUser = await getUserByEmail(email);
  const isNewUser = !existingUser;

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

  const user = result.rows[0];

  // If it's a new user, assign owner role by default
  if (isNewUser) {
    await assignRoleToUser(user.id, ROLES.OWNER);
  }

  return user;
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

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const pool = getDatabasePool();

  const query = "SELECT * FROM users ORDER BY created_at";
  const result = await pool.query(query);

  return result.rows;
}

export async function getUserByGoogleId(
  googleId: string
): Promise<User | null> {
  const pool = getDatabasePool();

  const query = "SELECT * FROM users WHERE google_id = $1";
  const result = await pool.query(query, [googleId]);

  return result.rows[0] || null;
}

/**
 * Create user with password
 */
export async function createUserWithPassword(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const pool = getDatabasePool();
  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomUUID();
  const verificationTokenExpires = new Date();
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

  const query = `
    INSERT INTO users (email, name, password_hash, verification_token, verification_token_expires)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await pool.query(query, [
    email,
    name || null,
    passwordHash,
    verificationToken,
    verificationTokenExpires,
  ]);

  const newUser = result.rows[0];

  // Assign owner role by default to new users
  await assignRoleToUser(newUser.id, ROLES.OWNER);

  return newUser;
}

/**
 * Verify user email
 */
export async function verifyUserEmail(token: string): Promise<User | null> {
  const pool = getDatabasePool();

  const query = `
    UPDATE users
    SET email_verified = true,
        verification_token = NULL,
        verification_token_expires = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE verification_token = $1
      AND verification_token_expires > NOW()
    RETURNING *
  `;

  const result = await pool.query(query, [token]);

  return result.rows[0] || null;
}

/**
 * Update verification token
 */
export async function updateVerificationToken(email: string): Promise<string> {
  const pool = getDatabasePool();
  const verificationToken = crypto.randomUUID();
  const verificationTokenExpires = new Date();
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

  const query = `
    UPDATE users
    SET verification_token = $1,
        verification_token_expires = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = $3
    RETURNING verification_token
  `;

  const result = await pool.query(query, [
    verificationToken,
    verificationTokenExpires,
    email,
  ]);

  return result.rows[0]?.verification_token || verificationToken;
}

/**
 * Update password
 */
export async function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const pool = getDatabasePool();

  const user = await getUserById(userId);
  if (!user || !user.password_hash) {
    return false;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    return false;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  const query = `
    UPDATE users
    SET password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  await pool.query(query, [newPasswordHash, userId]);
  return true;
}

/**
 * Set password for users without password (e.g., Google-only users)
 */
export async function setPassword(
  userId: number,
  password: string
): Promise<boolean> {
  const pool = getDatabasePool();

  const user = await getUserById(userId);
  if (!user) {
    return false;
  }

  if (user.password_hash) {
    return false;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
    UPDATE users
    SET password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  await pool.query(query, [passwordHash, userId]);
  return true;
}

/**
 * Delete user
 */
export async function deleteUser(userId: number): Promise<boolean> {
  const pool = getDatabasePool();

  const query = "DELETE FROM users WHERE id = $1";
  const result = await pool.query(query, [userId]);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get user login methods
 */
export async function getUserLoginMethods(
  userId: number
): Promise<LoginMethods> {
  const pool = getDatabasePool();

  const query = `
    SELECT 
      CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as has_password,
      CASE WHEN google_id IS NOT NULL THEN true ELSE false END as has_google
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return { hasPassword: false, hasGoogle: false };
  }

  return {
    hasPassword: result.rows[0].has_password,
    hasGoogle: result.rows[0].has_google,
  };
}

/**
 * Merge account with Google ID
 */
export async function mergeAccountWithGoogle(
  email: string,
  googleId: string,
  name?: string,
  image?: string
): Promise<User> {
  const pool = getDatabasePool();

  const query = `
    UPDATE users
    SET google_id = $1,
        name = COALESCE($2, name),
        image = COALESCE($3, image),
        updated_at = CURRENT_TIMESTAMP
    WHERE email = $4
    RETURNING *
  `;

  const result = await pool.query(query, [
    googleId,
    name || null,
    image || null,
    email,
  ]);

  return result.rows[0];
}

/**
 * Verify password
 */
export async function verifyPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return user;
}

