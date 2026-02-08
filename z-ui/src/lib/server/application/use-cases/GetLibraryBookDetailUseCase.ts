import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { DeviceDownloadRepositoryPort } from '$lib/server/application/ports/DeviceDownloadRepositoryPort';
import type { StoragePort } from '$lib/server/application/ports/StoragePort';
import { extractPercentFinished } from '$lib/server/domain/value-objects/ProgressFile';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';

interface GetLibraryBookDetailInput {
	bookId: number;
}

export interface LibraryBookDetail {
	success: true;
	bookId: number;
	progressPercent: number | null;
	downloadedDevices: string[];
}

export class GetLibraryBookDetailUseCase {
	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly storage: StoragePort,
		private readonly deviceDownloadRepository: DeviceDownloadRepositoryPort
	) {}

	async execute(input: GetLibraryBookDetailInput): Promise<ApiResult<LibraryBookDetail>> {
		const book = await this.bookRepository.getById(input.bookId);
		if (!book) {
			return apiError('Book not found', 404);
		}

		const downloads = await this.deviceDownloadRepository.getByBookId(input.bookId);
		const downloadedDevices = [...new Set(downloads.map((download) => download.deviceId))].sort();

		let progressPercent: number | null = null;
		if (book.progress_storage_key) {
			try {
				const content = (await this.storage.get(`library/${book.progress_storage_key}`)).toString('utf8');
				const percentFinished = extractPercentFinished(content);
				if (percentFinished !== null) {
					progressPercent = Math.max(0, Math.min(100, percentFinished * 100));
				}
			} catch {
				progressPercent = null;
			}
		}

		return apiOk({
			success: true,
			bookId: input.bookId,
			progressPercent,
			downloadedDevices
		});
	}
}
