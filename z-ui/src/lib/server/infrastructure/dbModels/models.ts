export interface Book {
	id: number;
	zLibId: string | null;
	s3_storage_key: string;
	title: string;
	author: string | null;
	cover: string | null;
	extension: string | null;
	filesize: number | null;
	language: string | null;
	year: number | null;
	createdAt: string | null;
	isDownloaded?: boolean;
}

export interface DeviceDownload {
	id: number;
	deviceId: string;
	bookId: number;
}

/**
 * Data required to create a new book in the library.
 */
export type CreateBookInput = Omit<Book, 'id' | 'createdAt'>;
