import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { Book, CreateBookInput } from '$lib/server/domain/entities/Book';
import { db } from '../db/db';

export class BookRepository implements BookRepositoryPort {
	private static readonly instance = new BookRepository();

	async getAll(): Promise<Book[]> {
		const result = await db.execute(`
            SELECT b.*, EXISTS(SELECT 1 FROM DeviceDownloads WHERE bookId = b.id) as isDownloaded 
            FROM Books b 
            ORDER BY b.createdAt DESC
        `);
		return result.rows.map((row) => ({
			...row,
			isDownloaded: Boolean(row.isDownloaded)
		})) as unknown as Book[];
	}

	async getById(id: number): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE id = ?',
			args: [id]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	async getByZLibId(zLibId: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE zLibId = ?',
			args: [zLibId]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	async getByStorageKey(storageKey: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE s3_storage_key = ?',
			args: [storageKey]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	async getByTitleAndExtension(title: string, extension: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE title = ? AND extension = ?',
			args: [title, extension]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	async getByTitle(title: string): Promise<Book | undefined> {
		const result = await db.execute({
			sql: 'SELECT * FROM Books WHERE title = ?',
			args: [title]
		});
		return (result.rows[0] as unknown as Book) ?? undefined;
	}

	async create(book: CreateBookInput): Promise<Book> {
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
			progress_storage_key: null,
			progress_updated_at: null,
			createdAt: new Date().toISOString()
		};
	}

	async delete(id: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM Books WHERE id = ?',
			args: [id]
		});
	}

	async resetDownloadStatus(bookId: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM DeviceDownloads WHERE bookId = ?',
			args: [bookId]
		});
	}

	async updateProgress(bookId: number, progressKey: string): Promise<void> {
		await db.execute({
			sql: 'UPDATE Books SET progress_storage_key = ?, progress_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
			args: [progressKey, bookId]
		});
	}

	async getNotDownloadedByDevice(deviceId: string): Promise<Book[]> {
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

	async count(): Promise<number> {
		const result = await db.execute('SELECT COUNT(*) as count FROM Books');
		return (result.rows[0] as unknown as { count: number }).count;
	}

	static async getAll(): Promise<Book[]> {
		return BookRepository.instance.getAll();
	}

	static async getById(id: number): Promise<Book | undefined> {
		return BookRepository.instance.getById(id);
	}

	static async getByZLibId(zLibId: string): Promise<Book | undefined> {
		return BookRepository.instance.getByZLibId(zLibId);
	}

	static async getByStorageKey(storageKey: string): Promise<Book | undefined> {
		return BookRepository.instance.getByStorageKey(storageKey);
	}

	static async getByTitleAndExtension(title: string, extension: string): Promise<Book | undefined> {
		return BookRepository.instance.getByTitleAndExtension(title, extension);
	}

	static async getByTitle(title: string): Promise<Book | undefined> {
		return BookRepository.instance.getByTitle(title);
	}

	static async create(book: CreateBookInput): Promise<Book> {
		return BookRepository.instance.create(book);
	}

	static async delete(id: number): Promise<void> {
		return BookRepository.instance.delete(id);
	}

	static async resetDownloadStatus(bookId: number): Promise<void> {
		return BookRepository.instance.resetDownloadStatus(bookId);
	}

	static async updateProgress(bookId: number, progressKey: string): Promise<void> {
		return BookRepository.instance.updateProgress(bookId, progressKey);
	}

	static async getNotDownloadedByDevice(deviceId: string): Promise<Book[]> {
		return BookRepository.instance.getNotDownloadedByDevice(deviceId);
	}

	static async count(): Promise<number> {
		return BookRepository.instance.count();
	}
}
