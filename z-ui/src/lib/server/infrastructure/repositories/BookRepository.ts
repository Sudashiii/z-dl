import type { Book } from '$lib/server/infrastructure/dbModels/models';
import { db } from '../db/db';

export class BookRepository {
	static async getAll(): Promise<Book[]> {
		const result = await db.execute('SELECT * FROM Books');
		return result.rows as unknown as Book[];
	}

	static async getById(id: number): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE id = ?',
			args: [id]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async create(book: Omit<Book, 'id'>): Promise<Book> {
		const result = await db.execute({
			sql: 'INSERT INTO Books (s3_storage_key, title) VALUES (?, ?)',
			args: [book.s3_storage_key, book.title]
		});

		// Turso returns `last_insert_rowid` in `result.lastInsertRowid`
		return {
			id: Number(result.lastInsertRowid),
			...book
		};
	}

	static async delete(id: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM Books WHERE id = ?',
			args: [id]
		});
	}

	static async getNotDownloadedByDevice(deviceId: string): Promise<Book[]> {
		const result = await db.execute({
			sql: `
				SELECT b.*
				FROM Books b
				LEFT JOIN DeviceDownloads d ON b.id = d.bookId AND d.deviceId = ?
				WHERE d.bookId IS NULL
			`,
			args: [deviceId]
		});
		return result.rows as unknown as Book[];
	}
}
