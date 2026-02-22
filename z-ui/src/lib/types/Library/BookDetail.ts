export interface LibraryBookDetail {
	success: boolean;
	bookId: number;
	progressPercent: number | null;
	rating: number | null;
	isRead: boolean;
	readAt: string | null;
	excludeFromNewBooks: boolean;
	downloadedDevices: string[];
}
