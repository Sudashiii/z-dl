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
	progress_storage_key: string | null;
	progress_updated_at: string | null;
	createdAt: string | null;
	isDownloaded?: boolean;
}

export type CreateBookInput = Omit<Book, 'id' | 'createdAt' | 'progress_storage_key' | 'progress_updated_at'>;

export interface UpdateBookMetadataInput {
	zLibId: string | null;
	title: string;
	author: string | null;
	cover: string | null;
	extension: string | null;
	filesize: number | null;
	language: string | null;
	year: number | null;
}
