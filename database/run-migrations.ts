import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { closeDatabasePool, getDatabasePool } from "./connection";

/**
 * Load env file into process.env without overwriting existing values.
 */
function loadEnvFile(filename: string): void {
  const filepath = resolve(process.cwd(), filename);
  if (!existsSync(filepath)) {
    return;
  }

  const content = readFileSync(filepath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

/**
 * Ensure the schema_migrations tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Run pending SQL migration files from database/migrations/ in alphabetical order.
 */
async function runMigrations(): Promise<void> {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const migrationsDir = join(__dirname, "migrations");
  if (!existsSync(migrationsDir)) {
    console.log("No migrations directory found. Nothing to run.");
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No SQL migration files found.");
    return;
  }

  await ensureMigrationsTable();
  const pool = getDatabasePool();

  for (const filename of files) {
    const alreadyApplied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [filename]
    );

    if ((alreadyApplied.rowCount ?? 0) > 0) {
      console.log(`Skipping already applied migration: ${filename}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, filename), "utf-8");
    console.log(`Applying migration: ${filename}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [filename]
      );
      await client.query("COMMIT");
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("Migrations complete.");
}

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
