export interface LibraryBookDetail {
	success: boolean;
	bookId: number;
	progressPercent: number | null;
	downloadedDevices: string[];
}
