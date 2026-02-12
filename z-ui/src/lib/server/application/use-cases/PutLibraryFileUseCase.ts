import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { StoragePort } from '$lib/server/application/ports/StoragePort';
import { apiOk, type ApiResult } from '$lib/server/http/api';
import { createChildLogger } from '$lib/server/infrastructure/logging/logger';

interface PutLibraryFileResult {
	success: true;
}

export class PutLibraryFileUseCase {
	private readonly useCaseLogger = createChildLogger({ useCase: 'PutLibraryFileUseCase' });

	constructor(
		private readonly storage: StoragePort,
		private readonly bookRepository: BookRepositoryPort
	) {}

	async execute(title: string, body: ArrayBuffer): Promise<ApiResult<PutLibraryFileResult>> {
		const key = `library/${title}`;
		await this.storage.put(key, Buffer.from(body), 'application/octet-stream');
		this.useCaseLogger.info({ event: 'library.file.uploaded', storageKey: title }, 'Library file uploaded');
		await this.bookRepository.create({
			s3_storage_key: title,
			title,
			zLibId: '000000',
			author: null,
			cover: null,
			extension: null,
			filesize: null,
			language: null,
			year: null
		});
		this.useCaseLogger.info({ event: 'library.book.created', storageKey: title }, 'Library book created from PUT');

		return apiOk({ success: true });
	}
}
