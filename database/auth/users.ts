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
  hourly_rate: number | null;
  digest_email: string | null;
  excluded_projects: string[];
  google_refresh_token: string | null;
  google_access_token: string | null;
  google_token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Partial Google OAuth token payload to persist on the user row. */
export interface GoogleTokensUpdate {
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: Date | null;
}

/** User fields required to send the weekly calendar digest. */
export interface WeeklyDigestUser {
  id: number;
  email: string;
  name: string | null;
  hourly_rate: number;
  digest_email: string | null;
  excluded_projects: string[];
  google_refresh_token: string;
  google_access_token: string | null;
  google_token_expires_at: Date | null;
}

/** Billing settings used by the settings API. */
export interface UserBillingSettings {
  hourlyRate: number | null;
  digestEmail: string | null;
  excludedProjects: string[];
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

/**
 * Persist Google OAuth tokens for a user.
 * Only overwrites google_refresh_token when a new refresh token is provided.
 */
export async function updateUserGoogleTokens(
  userId: number,
  tokens: GoogleTokensUpdate
): Promise<boolean> {
  const pool = getDatabasePool();
  const setClauses: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: Array<string | Date | number | null> = [];
  let paramIndex = 1;

  if (tokens.refreshToken !== undefined) {
    setClauses.push(`google_refresh_token = $${paramIndex++}`);
    values.push(tokens.refreshToken);
  }

  if (tokens.accessToken !== undefined) {
    setClauses.push(`google_access_token = $${paramIndex++}`);
    values.push(tokens.accessToken ?? null);
  }

  if (tokens.expiresAt !== undefined) {
    setClauses.push(`google_token_expires_at = $${paramIndex++}`);
    values.push(tokens.expiresAt);
  }

  if (values.length === 0) {
    return false;
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIndex}
  `;

  const result = await pool.query(query, values);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Update the user's hourly rate used for weekly digest billing.
 */
export async function updateUserHourlyRate(
  userId: number,
  hourlyRate: number | null
): Promise<boolean> {
  const pool = getDatabasePool();

  const query = `
    UPDATE users
    SET hourly_rate = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  const result = await pool.query(query, [hourlyRate, userId]);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get the user's hourly rate, or null if unset / user not found.
 */
export async function getUserHourlyRate(
  userId: number
): Promise<number | null> {
  const pool = getDatabasePool();

  const query = "SELECT hourly_rate FROM users WHERE id = $1";
  const result = await pool.query(query, [userId]);

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  const rate = result.rows[0].hourly_rate;
  return rate === null || rate === undefined ? null : Number(rate);
}

/**
 * Get the digest notification email override, or null if unset / user not found.
 */
export async function getUserDigestEmail(
  userId: number
): Promise<string | null> {
  const pool = getDatabasePool();

  const query = "SELECT digest_email FROM users WHERE id = $1";
  const result = await pool.query(query, [userId]);

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return result.rows[0].digest_email ?? null;
}

/**
 * Update the digest notification email override (null clears it).
 */
export async function updateUserDigestEmail(
  userId: number,
  digestEmail: string | null
): Promise<boolean> {
  const pool = getDatabasePool();

  const query = `
    UPDATE users
    SET digest_email = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  const result = await pool.query(query, [digestEmail, userId]);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Normalize excluded projects: trim, drop empties, dedupe case-insensitively
 * while keeping the first casing seen.
 */
function normalizeExcludedProjects(projects: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const project of projects) {
    const trimmed = project.trim();
    if (trimmed === "") {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/**
 * Map a Postgres TEXT[] (or null) to a string array.
 */
function mapExcludedProjects(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Get billing settings (hourly rate, digest email, excluded projects) for a user.
 */
export async function getUserBillingSettings(
  userId: number
): Promise<UserBillingSettings | null> {
  const pool = getDatabasePool();

  const query = `
    SELECT hourly_rate, digest_email, excluded_projects
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [userId]);

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  const row = result.rows[0];
  const rate = row.hourly_rate;

  return {
    hourlyRate: rate === null || rate === undefined ? null : Number(rate),
    digestEmail: row.digest_email ?? null,
    excludedProjects: mapExcludedProjects(row.excluded_projects),
  };
}

/**
 * Update billing settings (hourly rate, digest email, and/or excluded projects).
 * Only provided fields are updated. Empty excludedProjects clears the list.
 */
export async function updateUserBillingSettings(
  userId: number,
  settings: {
    hourlyRate?: number | null;
    digestEmail?: string | null;
    excludedProjects?: string[];
  }
): Promise<boolean> {
  const pool = getDatabasePool();
  const setClauses: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: Array<string | number | string[] | null> = [];
  let paramIndex = 1;

  if (settings.hourlyRate !== undefined) {
    setClauses.push(`hourly_rate = $${paramIndex++}`);
    values.push(settings.hourlyRate);
  }

  if (settings.digestEmail !== undefined) {
    setClauses.push(`digest_email = $${paramIndex++}`);
    values.push(settings.digestEmail);
  }

  if (settings.excludedProjects !== undefined) {
    setClauses.push(`excluded_projects = $${paramIndex++}`);
    values.push(normalizeExcludedProjects(settings.excludedProjects));
  }

  if (values.length === 0) {
    return false;
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIndex}
  `;

  const result = await pool.query(query, values);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Users eligible for the weekly digest (have hourly rate and Google refresh token).
 */
export async function getUsersForWeeklyDigest(): Promise<WeeklyDigestUser[]> {
  const pool = getDatabasePool();

  const query = `
    SELECT
      id,
      email,
      name,
      hourly_rate,
      digest_email,
      excluded_projects,
      google_refresh_token,
      google_access_token,
      google_token_expires_at
    FROM users
    WHERE hourly_rate IS NOT NULL
      AND google_refresh_token IS NOT NULL
    ORDER BY id
  `;

  const result = await pool.query(query);

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    hourly_rate: Number(row.hourly_rate),
    digest_email: row.digest_email ?? null,
    excluded_projects: mapExcludedProjects(row.excluded_projects),
    google_refresh_token: row.google_refresh_token,
    google_access_token: row.google_access_token,
    google_token_expires_at: row.google_token_expires_at,
  }));
}
