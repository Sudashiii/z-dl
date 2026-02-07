import type { Book, CreateBookInput } from '$lib/server/infrastructure/dbModels/models';
import { db } from '../db/db';

export class BookRepository {
	static async getAll(): Promise<Book[]> {
		const result = await db.execute(`
            SELECT b.*, EXISTS(SELECT 1 FROM DeviceDownloads WHERE bookId = b.id) as isDownloaded 
            FROM Books b 
            ORDER BY b.createdAt DESC
        `);
		return result.rows.map(row => ({
			...row,
			isDownloaded: Boolean(row.isDownloaded)
		})) as unknown as Book[];
	}

	static async getById(id: number): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE id = ?',
			args: [id]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async getByZLibId(zLibId: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE zLibId = ?',
			args: [zLibId]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async getByStorageKey(storageKey: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE s3_storage_key = ?',
			args: [storageKey]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async getByTitleAndExtension(title: string, extension: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE title = ? AND extension = ?',
			args: [title, extension]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async getByTitle(title: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE title = ?',
			args: [title]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	static async create(book: CreateBookInput): Promise<Book> {
		const result = await db.execute({
			sql: `INSERT INTO Books (zLibId, s3_storage_key, title, author, cover, extension, filesize, language, year)
			      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				book.zLibId,
				book.s3_storage_key,
				book.title,
				book.author,
				book.cover,
				book.extension,
				book.filesize,
				book.language,
				book.year
			]
		});

		return {
			id: Number(result.lastInsertRowid),
			...book,
			createdAt: new Date().toISOString()
		};
	}

	static async delete(id: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM Books WHERE id = ?',
			args: [id]
		});
	}

	static async resetDownloadStatus(bookId: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM DeviceDownloads WHERE bookId = ?',
			args: [bookId]
		});
	}

	static async updateProgress(bookId: number, progressKey: string): Promise<void> {
		await db.execute({
			sql: 'UPDATE Books SET progress_storage_key = ?, progress_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
			args: [progressKey, bookId]
		});
	}

	static async getNotDownloadedByDevice(deviceId: string): Promise<Book[]> {
		const result = await db.execute({
			sql: `
				SELECT b.*
				FROM Books b
				LEFT JOIN DeviceDownloads d ON b.id = d.bookId AND d.deviceId = ?
				WHERE d.bookId IS NULL
				ORDER BY b.createdAt DESC
			`,
			args: [deviceId]
		});
		return result.rows as unknown as Book[];
	}

	static async count(): Promise<number> {
		const result = await db.execute('SELECT COUNT(*) as count FROM Books');
		return (result.rows[0] as any).count;
	}
}
