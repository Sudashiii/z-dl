/**
 * Script to create a new migration file.
 * Usage: deno task new-migration <migration_name>
 *
 * This will create a file like:
 * migrations/1678886400_create_users_table.ts
 */
import { join } from "std/path";
import { ensureDir } from "std/fs";

const MIGRATIONS_DIR = "migrations";

const name = Deno.args[0];
if (!name) {
  console.error("Error: Please provide a name for the migration.");
  console.log("Usage: deno task new-migration <migration_name>");
  Deno.exit(1);
}

const sanitizedName = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
const timestamp = Math.floor(Date.now() / 1000); 
const filename = `${timestamp}_${sanitizedName}.ts`;
const filePath = join(Deno.cwd(), MIGRATIONS_DIR, filename);

const template = `// Migration: ${name}
import type { Client } from "@libsql/client";

export async function up(db: Client): Promise<void> {
  // Write your 'up' migration SQL here
  // Example:
  // await db.execute(\`
  //   CREATE TABLE IF NOT EXISTS users (
  //     id TEXT PRIMARY KEY,
  //     username TEXT NOT NULL UNIQUE
  //   );
  // \`);
  console.log("Applying 'up' migration: ${name}");
}

export async function down(db: Client): Promise<void> {
  // Write your 'down' migration SQL here
  // Example:
  // await db.execute(\`
  //   DROP TABLE IF EXISTS users;
  // \`);
  console.log("Applying 'down' migration: ${name}");
}
`;

await ensureDir(MIGRATIONS_DIR);

await Deno.writeTextFile(filePath, template);
console.log(`Created migration: ${MIGRATIONS_DIR}/${filename}`);