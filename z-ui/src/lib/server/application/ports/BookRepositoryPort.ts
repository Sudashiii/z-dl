import type { Book, CreateBookInput } from '$lib/server/domain/entities/Book';

export interface BookRepositoryPort {
	getAll(): Promise<Book[]>;
	getById(id: number): Promise<Book | undefined>;
	getByZLibId(zLibId: string): Promise<Book | undefined>;
	getByStorageKey(storageKey: string): Promise<Book | undefined>;
	getByTitleAndExtension(title: string, extension: string): Promise<Book | undefined>;
	getByTitle(title: string): Promise<Book | undefined>;
	create(book: CreateBookInput): Promise<Book>;
	delete(id: number): Promise<void>;
	resetDownloadStatus(bookId: number): Promise<void>;
	updateProgress(bookId: number, progressKey: string): Promise<void>;
	getNotDownloadedByDevice(deviceId: string): Promise<Book[]>;
	count(): Promise<number>;
}
