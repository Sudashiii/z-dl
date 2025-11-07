import { db } from '$lib/server/infrastructure/db';
import type { Book } from '$lib/server/infrastructure/dbModels/models';

export class BookRepository {
	static getAll(): Book[] {
		return db.prepare('SELECT * FROM Books').all() as Book[];
	}

	static getById(id: number): Book | undefined {
		return db.prepare('SELECT * FROM Books WHERE id = ?').get(id) as Book | undefined;
	}

	static create(book: Omit<Book, 'id'>): Book {
		const result = db
			.prepare('INSERT INTO Books (s3_storage_key, title) VALUES (?, ?)')
			.run(book.s3_storage_key, book.title);

		return {
			id: Number(result.lastInsertRowid),
			...book
		};
	}

	static delete(id: number): void {
		db.prepare('DELETE FROM Books WHERE id = ?').run(id);
	}

	static getNotDownloadedByDevice(deviceId: string): Book[] {
		return db
			.prepare(
				`
				SELECT b.*
				FROM Books b
				LEFT JOIN DeviceDownloads d ON b.id = d.bookId AND d.deviceId = ?
				WHERE d.bookId IS NULL
				`
			)
			.all(deviceId) as Book[];
	}
}
