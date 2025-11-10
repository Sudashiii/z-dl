// Migration: InitialMigration
import type { Client } from "@libsql/client";

export async function up(db: Client): Promise<void> {
	await db.execute(`
		CREATE TABLE IF NOT EXISTS Books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			s3_storage_key TEXT NOT NULL,
			title TEXT NOT NULL
		)
	`);

	await db.execute(`
		CREATE TABLE IF NOT EXISTS DeviceDownloads (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			deviceId TEXT NOT NULL,
			bookId INTEGER NOT NULL,
			FOREIGN KEY (bookId) REFERENCES Books(id) ON DELETE CASCADE
		)
	`);

  console.log("Applying 'up' migration: InitialMigration");
}

export async function down(db: Client): Promise<void> {
await db.execute(`
        DROP TABLE IF EXISTS DeviceDownloads;
    `);

    await db.execute(`
        DROP TABLE IF EXISTS Books;
    `);
  console.log("Applying 'down' migration: InitialMigration");
}
