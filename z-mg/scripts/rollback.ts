/**
 * Script to roll back the last applied 'down' migration.
 * It finds the most recent entry in the _migrations table
 * and runs its corresponding 'down' function.
 */
import { db, type Migration } from "./_db.ts";
import { join, toFileUrl } from "std/path";

const MIGRATIONS_TABLE = "_migrations";
const MIGRATIONS_DIR = "migrations";

async function getLastAppliedMigration(): Promise<string | null> {
  try {
    const result = await db.execute(`
      SELECT name FROM ${MIGRATIONS_TABLE} 
      ORDER BY id DESC 
      LIMIT 1
    `);
    return result.rows.length > 0 ? (result.rows[0].name as string) : null;
  } catch (e: any) {
    if (e.message.includes("no such table")) {
      console.log("Migrations table not found. No migrations to roll back.");
      return null;
    }
    throw e;
  }
}

async function runRollback() {
  console.log("Starting rollback process...");
  try {
    // 1. Get the last applied migration
    const migrationName = await getLastAppliedMigration();

    if (!migrationName) {
      console.log("No applied migrations to roll back.");
      return;
    }

    console.log(`- Rolling back: ${migrationName}`);
    const filePath = join(Deno.cwd(), MIGRATIONS_DIR, migrationName);
    const fileUrl = toFileUrl(filePath).href;

    try {
      // 2. Dynamically import the migration file
      const migration: Migration = await import(fileUrl);
      
      // 3. Run the 'down' function
      await migration.down(db);

      // 4. Remove the migration record from the database
      await db.execute({
        sql: `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`,
        args: [migrationName],
      });
      
      console.log(`  ...Success: Rolled back ${migrationName}`);

    } catch (err) {
      console.error(`Failed to roll back migration: ${migrationName}`, err);
      throw new Error(`Rollback ${migrationName} failed.`);
    }
    
    console.log("Rollback process completed successfully.");

  } catch (err) {
    // @ts-ignore
    console.error("Rollback failed:", err.message);
    Deno.exit(1);
  } finally {
    db.close();
  }
}

runRollback();