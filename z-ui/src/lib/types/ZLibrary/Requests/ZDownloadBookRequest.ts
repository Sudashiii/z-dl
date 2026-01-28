export interface ZDownloadBookRequest {
	bookId: string;
	hash: string;
	title: string;
	upload: boolean;
	extension: string;
	author?: string;
	cover?: string;
	filesize?: number;
	language?: string;
	year?: number;
	downloadToDevice?: boolean;
}
