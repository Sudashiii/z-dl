import { getDbClient } from './db.ts';
import { Client, Transaction } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the shape of a migration file
export interface Migration {
  up: (tx: Transaction) => Promise<void>;
  down: (tx: Transaction) => Promise<void>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const MIGRATIONS_TABLE = '_migrations';

/**
 * Ensures the migrations directory exists.
 */
function ensureMigrationsDir(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`Creating migrations directory: ${MIGRATIONS_DIR}`);
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
}

/**
 * Ensures the migration tracking table exists in the database.
 * @param {Client} db - The database client.
 */
async function ensureMigrationsTable(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Gets the list of already applied migration names from the database.
 * @param {Client} db - The database client.
 * @returns {Promise<Set<string>>} A set of applied migration names.
 */
async function getAppliedMigrations(db: Client): Promise<Set<string>> {
  await ensureMigrationsTable(db);
  const rs = await db.execute(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`);
  return new Set(rs.rows.map(row => row.name as string));
}

/**
 * Gets the list of all available migration files from the filesystem.
 * @returns {Promise<string[]>} A sorted list of migration filenames.
 */
async function getMigrationFiles(): Promise<string[]> {
  ensureMigrationsDir();
  const files = await fs.promises.readdir(MIGRATIONS_DIR);
  return files
    .filter(file => file.endsWith('.ts'))
    .sort();
}

/**
 * Imports a migration file and returns its content.
 * @param {string} fileName - The name of the migration file.
 * @returns {Promise<Migration>} The imported migration object.
 */
async function importMigration(fileName: string): Promise<Migration> {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  // Use file:// URL for ES module import
  const fileUrl = `file://${filePath}`;
  const migrationModule = await import(fileUrl);
  
  if (typeof migrationModule.up !== 'function' || typeof migrationModule.down !== 'function') {
    throw new Error(`Invalid migration file, must export 'up' and 'down' functions: ${fileName}`);
  }
  return migrationModule as Migration;
}

/**
 * Command: Create a new migration file.
 * @param {string} name - The descriptive name for the migration.
 */
async function createMigration(name: string): Promise<void> {
  ensureMigrationsDir();
  const timestamp = Date.now();
  const fileName = `${timestamp}_${name}.ts`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  const template = `import { Transaction } from '@libsql/client';

export async function up(tx: Transaction): Promise<void> {
  // Add your UP migration logic here
  // Example:
  // await tx.execute(\`
  //   CREATE TABLE users (
  //     id INTEGER PRIMARY KEY,
  //     email TEXT NOT NULL UNIQUE
  //   );
  // \`);
}

export async function down(tx: Transaction): Promise<void> {
  // Add your DOWN migration logic here
  // Example:
  // await tx.execute(\`DROP TABLE IF EXISTS users;\`);
}
`;

  await fs.promises.writeFile(filePath, template);
  console.log(`Created migration file: ${fileName}`);
}

/**
 * Command: Apply all pending migrations.
 */
async function migrateUp(): Promise<void> {
  const db = getDbClient();
  console.log('Connecting to database...');
  
  try {
    const appliedMigrations = await getAppliedMigrations(db);
    const migrationFiles = await getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.has(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('Database is already up-to-date.');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):`);
    
    for (const fileName of pendingMigrations) {
      console.log(`- Applying ${fileName}...`);
      const migration = await importMigration(fileName);
      
      const tx = await db.transaction();
      try {
        await migration.up(tx);
        await tx.execute({
          sql: `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
          args: [fileName],
        });
        await tx.commit();
        console.log(`  ...applied ${fileName}`);
      } catch (err) {
        console.error(`Failed to apply migration ${fileName}:`, err);
        await tx.rollback();
        throw new Error(`Migration ${fileName} failed.`);
      }
    }

    console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    db.close();
    console.log('Database connection closed.');
  }
}

/**
 * Command: Revert the last applied migration.
 */
async function migrateDown(): Promise<void> {
  const db = getDbClient();
  console.log('Connecting to database...');

  try {
    await ensureMigrationsTable(db);
    const lastMigrationRs = await db.execute(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at DESC, name DESC LIMIT 1`
    );

    if (lastMigrationRs.rows.length === 0) {
      console.log('No migrations to revert.');
      return;
    }

    const fileName = lastMigrationRs.rows[0].name as string;
    console.log(`Reverting last migration: ${fileName}...`);

    const migration = await importMigration(fileName);
    const tx = await db.transaction();
    try {
      await migration.down(tx);
      await tx.execute({
        sql: `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`,
        args: [fileName],
      });
      await tx.commit();
      console.log(`  ...reverted ${fileName}`);
    } catch (err) {
      console.error(`Failed to revert migration ${fileName}:`, err);
      await tx.rollback();
      throw new Error(`Migration ${fileName} failed to revert.`);
    }

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    db.close();
    console.log('Database connection closed.');
  }
}

/**
 * Main function to parse commands and execute.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      const name = args[1];
      if (!name) {
        console.error('Error: Migration name is required.');
        console.log('Usage: npm run db:migrate:create <migration_name>');
        process.exit(1);
      }
      await createMigration(name);
      break;

    case 'up':
      await migrateUp();
      break;

    case 'down':
      await migrateDown();
      break;

    default:
      console.log('Usage:');
      console.log('  npm run db:migrate:create <migration_name>  - Create a new migration file');
      console.log('  npm run db:migrate:up                     - Apply all pending migrations');
      console.log('  npm run db:migrate:down                   - Revert the last applied migration');
      process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});