import { createClient } from '@libsql/client';
import { TURSO_DB_URL, TURSO_DB_AUTH_TOKEN } from '$env/static/private';

export const db = createClient({
	url: TURSO_DB_URL,
	authToken: TURSO_DB_AUTH_TOKEN
});

export async function initializeDatabase() {
	await db.execute(`
		CREATE TABLE IF NOT EXISTS Books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			s3_storage_key TEXT NOT NULL,
			title TEXT NOT NULL,
			zLibId TEXT,
			author TEXT,
			cover TEXT,
			extension TEXT,
			filesize INTEGER,
			language TEXT,
			year INTEGER,
			progress_storage_key TEXT,
			progress_updated_at TEXT,
			createdAt TEXT
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
}
