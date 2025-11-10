/**
 * Script to run all pending 'up' migrations.
 * It checks a _migrations table in the DB to see which
 * migrations have already been applied.
 */
import { db, type Migration } from "./_db.ts";
import { ensureDir } from "std/fs";
import { join, toFileUrl } from "std/path";

const MIGRATIONS_TABLE = "_migrations";
const MIGRATIONS_DIR = "migrations";

async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await db.execute(`SELECT name FROM ${MIGRATIONS_TABLE}`);
  return new Set(result.rows.map((r) => r.name as string));
}

async function getLocalMigrations(): Promise<string[]> {
  await ensureDir(MIGRATIONS_DIR); 
  const migrations: string[] = [];
  for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
    if (entry.isFile && entry.name.endsWith(".ts")) {
      migrations.push(entry.name);
    }
  }
  return migrations.sort(); 
}

async function runMigrations() {
  console.log("Starting migration process...");
  try {
    // 1. Ensure the migrations table exists
    await ensureMigrationsTable();
    
    // 2. Get applied and local migrations
    const appliedMigrations = await getAppliedMigrations();
    const localMigrations = await getLocalMigrations();

    // 3. Determine pending migrations
    const pendingMigrations = localMigrations.filter(
      (name) => !appliedMigrations.has(name)
    );

    if (pendingMigrations.length === 0) {
      console.log("Database is up to date. No migrations to apply.");
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):`);
    
    // 4. Apply pending migrations in order
    for (const migrationName of pendingMigrations) {
      console.log(`- Applying: ${migrationName}`);
      const filePath = join(Deno.cwd(), MIGRATIONS_DIR, migrationName);
      const fileUrl = toFileUrl(filePath).href;

      try {
        // Dynamically import the migration file
        const migration: Migration = await import(fileUrl);
        
        // Run the 'up' function
        await migration.up(db);

        // Record the migration in the database
        await db.execute({
          sql: `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
          args: [migrationName],
        });
        
        console.log(`  ...Success: ${migrationName}`);

      } catch (err) {
        console.error(`Failed to apply migration: ${migrationName}`, err);
        throw new Error(`Migration ${migrationName} failed.`);
      }
    }
    
    console.log("Migration process completed successfully.");

  } catch (err) {
    // @ts-ignore
    console.error("Migration failed:", err.message);
    Deno.exit(1);
  } finally {
    db.close();
  }
}

runMigrations();