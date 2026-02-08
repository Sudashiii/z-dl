import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { ZLibraryCredentials, ZLibraryPort } from '$lib/server/application/ports/ZLibraryPort';
import { apiOk, type ApiResult } from '$lib/server/http/api';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

interface UploadService {
	upload(fileName: string, data: Buffer): Promise<void>;
}

interface DownloadBookUseCaseInput {
	request: ZDownloadBookRequest;
	credentials: ZLibraryCredentials;
}

interface DownloadBookUseCaseResult {
	success: true;
	fileData?: ArrayBuffer;
	responseHeaders?: Headers;
}

export class DownloadBookUseCase {
	constructor(
		private readonly zlibrary: ZLibraryPort,
		private readonly bookRepository: BookRepositoryPort,
		private readonly uploadServiceFactory: () => UploadService
	) {}

	async execute(input: DownloadBookUseCaseInput): Promise<ApiResult<DownloadBookUseCaseResult>> {
		const { request, credentials } = input;

		const loginResult = await this.zlibrary.tokenLogin(credentials.userId, credentials.userKey);
		if (!loginResult.ok) {
			return loginResult;
		}

		const downloadResult = await this.zlibrary.download(request.bookId, request.hash, credentials);
		if (!downloadResult.ok) {
			return downloadResult;
		}

		const fileData = await downloadResult.value.arrayBuffer();

		if (request.upload) {
			const key = `${request.title}_${request.bookId}.${request.extension}`;
			const uploadService = this.uploadServiceFactory();
			await uploadService.upload(key, Buffer.from(fileData));

			await this.bookRepository.create({
				zLibId: request.bookId,
				s3_storage_key: key,
				title: request.title,
				author: request.author ?? null,
				cover: request.cover ?? null,
				extension: request.extension ?? null,
				filesize: request.filesize ?? null,
				language: request.language ?? null,
				year: request.year ?? null
			});
		}

		if (request.downloadToDevice === false) {
			return apiOk({ success: true });
		}

		return apiOk({
			success: true,
			fileData,
			responseHeaders: downloadResult.value.headers
		});
	}
}
