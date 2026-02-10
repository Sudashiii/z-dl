import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { DeviceProgressDownloadRepositoryPort } from '$lib/server/application/ports/DeviceProgressDownloadRepositoryPort';
import type { StoragePort } from '$lib/server/application/ports/StoragePort';
import { isIncomingProgressOlder } from '$lib/server/domain/services/ProgressConflictPolicy';
import {
	buildProgressFileDescriptor,
	extractSummaryModified,
	normalizeProgressLookupTitle
} from '$lib/server/domain/value-objects/ProgressFile';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';

interface PutProgressInput {
	fileName: string;
	fileData: ArrayBuffer;
	deviceId?: string;
}

interface PutProgressResult {
	progressKey: string;
	incomingLatest: string | null;
}

export class PutProgressUseCase {
	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly storage: StoragePort,
		private readonly deviceProgressDownloadRepository: DeviceProgressDownloadRepositoryPort
	) {}

	async execute(input: PutProgressInput): Promise<ApiResult<PutProgressResult>> {
		const normalizedTitle = normalizeProgressLookupTitle(input.fileName);
		const book = await this.bookRepository.getByStorageKey(normalizedTitle);
		if (!book) {
			return apiError('Book not found', 404);
		}

		let progressKey: string;
		try {
			progressKey = buildProgressFileDescriptor(book.s3_storage_key).progressKey;
		} catch (cause) {
			return apiError('Invalid title format. Expected filename with extension.', 400, cause);
		}

		const incomingText = Buffer.from(input.fileData).toString('utf8');
		const incomingLatest = extractSummaryModified(incomingText);

		try {
			const existingKey = `library/${progressKey}`;
			const existingData = await this.storage.get(existingKey);
			const existingText = Buffer.from(existingData).toString('utf8');
			const existingLatest = extractSummaryModified(existingText);

			if (isIncomingProgressOlder(existingLatest, incomingLatest)) {
				return apiError('Incoming progress is older than stored progress', 409);
			}
		} catch {
			// No existing progress file. Continue with upload.
		}

		const uploadKey = `library/${progressKey}`;
		await this.storage.put(uploadKey, Buffer.from(input.fileData), 'application/x-lua');
		await this.bookRepository.updateProgress(book.id, progressKey);

		if (input.deviceId && input.deviceId.trim() !== '') {
			const updatedBook = await this.bookRepository.getById(book.id);
			if (updatedBook?.progress_updated_at) {
				await this.deviceProgressDownloadRepository.upsertByDeviceAndBook({
					deviceId: input.deviceId.trim(),
					bookId: book.id,
					progressUpdatedAt: updatedBook.progress_updated_at
				});
			}
		}

		return apiOk({ progressKey, incomingLatest });
	}
}
