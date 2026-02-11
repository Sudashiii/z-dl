export interface LibraryBook {
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
	progressPercent?: number | null;
	createdAt: string | null;
	deleted_at?: string | null;
	trash_expires_at?: string | null;
	isDownloaded?: boolean;
}
