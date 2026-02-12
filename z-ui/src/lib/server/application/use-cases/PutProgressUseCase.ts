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
import { createChildLogger } from '$lib/server/infrastructure/logging/logger';

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
	private readonly useCaseLogger = createChildLogger({ useCase: 'PutProgressUseCase' });

	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly storage: StoragePort,
		private readonly deviceProgressDownloadRepository: DeviceProgressDownloadRepositoryPort
	) {}

	async execute(input: PutProgressInput): Promise<ApiResult<PutProgressResult>> {
		const normalizedTitle = normalizeProgressLookupTitle(input.fileName);
		const book = await this.bookRepository.getByStorageKey(normalizedTitle);
		if (!book) {
			this.useCaseLogger.warn(
				{
					event: 'progress.book.not_found',
					fileName: input.fileName,
					searchedStorageKey: normalizedTitle
				},
				`Book with title "${normalizedTitle}" was not found`
			);
			return apiError('Book not found', 404);
		}

		let progressKey: string;
		try {
			progressKey = buildProgressFileDescriptor(book.s3_storage_key).progressKey;
		} catch (cause) {
			this.useCaseLogger.error(
				{
					event: 'progress.key.build_failed',
					bookId: book.id,
					storageKey: book.s3_storage_key,
					fileName: input.fileName
				},
				'Failed to build progress file descriptor'
			);
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
				this.useCaseLogger.warn(
					{
						event: 'progress.conflict.incoming_older',
						bookId: book.id,
						progressKey,
						existingLatest,
						incomingLatest
					},
					'Rejected progress upload because incoming progress is older'
				);
				return apiError('Incoming progress is older than stored progress', 409);
			}
		} catch {
			// No existing progress file. Continue with upload.
			this.useCaseLogger.info(
				{ event: 'progress.existing.not_found', bookId: book.id, progressKey },
				'No existing progress file found, writing new progress'
			);
		}

		const uploadKey = `library/${progressKey}`;
		await this.storage.put(uploadKey, Buffer.from(input.fileData), 'application/x-lua');
		await this.bookRepository.updateProgress(book.id, progressKey);
		this.useCaseLogger.info(
			{
				event: 'progress.uploaded',
				bookId: book.id,
				progressKey,
				deviceId: input.deviceId ?? null,
				incomingLatest
			},
			'Progress uploaded and book updated'
		);

		if (input.deviceId && input.deviceId.trim() !== '') {
			const updatedBook = await this.bookRepository.getById(book.id);
			if (updatedBook?.progress_updated_at) {
				await this.deviceProgressDownloadRepository.upsertByDeviceAndBook({
					deviceId: input.deviceId.trim(),
					bookId: book.id,
					progressUpdatedAt: updatedBook.progress_updated_at
				});
				this.useCaseLogger.info(
					{
						event: 'progress.device.confirmed',
						bookId: book.id,
						deviceId: input.deviceId.trim(),
						progressUpdatedAt: updatedBook.progress_updated_at
					},
					'Device progress download marker updated'
				);
			}
		}

		return apiOk({ progressKey, incomingLatest });
	}
}
