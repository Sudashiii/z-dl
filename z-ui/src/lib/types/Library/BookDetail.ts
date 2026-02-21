export interface LibraryBookDetail {
	success: boolean;
	bookId: number;
	progressPercent: number | null;
	rating: number | null;
	downloadedDevices: string[];
}
