import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { DeviceDownloadRepositoryPort } from '$lib/server/application/ports/DeviceDownloadRepositoryPort';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';

interface GetLibraryBookDetailInput {
	bookId: number;
}

export interface LibraryBookDetail {
	success: true;
	bookId: number;
	progressPercent: number | null;
	rating: number | null;
	isRead: boolean;
	readAt: string | null;
	excludeFromNewBooks: boolean;
	downloadedDevices: string[];
}

export class GetLibraryBookDetailUseCase {
	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly deviceDownloadRepository: DeviceDownloadRepositoryPort
	) {}

	async execute(input: GetLibraryBookDetailInput): Promise<ApiResult<LibraryBookDetail>> {
		const book = await this.bookRepository.getById(input.bookId);
		if (!book) {
			return apiError('Book not found', 404);
		}

		const downloads = await this.deviceDownloadRepository.getByBookId(input.bookId);
		const downloadedDevices = [...new Set(downloads.map((download) => download.deviceId))].sort();

		const progressPercent =
			typeof book.progress_percent === 'number'
				? Math.max(0, Math.min(100, book.progress_percent * 100))
				: null;

		return apiOk({
			success: true,
			bookId: input.bookId,
			progressPercent,
			rating: book.rating,
			isRead: Boolean(book.read_at),
			readAt: book.read_at,
			excludeFromNewBooks: book.exclude_from_new_books,
			downloadedDevices
		});
	}
}
