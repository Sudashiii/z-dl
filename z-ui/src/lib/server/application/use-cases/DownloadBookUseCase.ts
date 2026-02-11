import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { ZLibraryCredentials, ZLibraryPort } from '$lib/server/application/ports/ZLibraryPort';
import { EpubMetadataService } from '$lib/server/application/services/EpubMetadataService';
import { apiOk, type ApiResult } from '$lib/server/http/api';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

interface UploadService {
	upload(fileName: string, data: Buffer | Uint8Array): Promise<void>;
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

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
	return Uint8Array.from(data).buffer as ArrayBuffer;
}

function buildDownloadHeaders(originalHeaders: Headers, byteLength: number, rewritten: boolean): Headers {
	const headers = new Headers(originalHeaders);

	// Always enforce actual payload length from the bytes we return.
	headers.set('content-length', String(byteLength));

	// If bytes changed, upstream integrity/encoding headers are no longer valid.
	if (rewritten) {
		headers.delete('content-encoding');
		headers.delete('transfer-encoding');
		headers.delete('content-range');
		headers.delete('etag');
		headers.delete('content-md5');
	}

	return headers;
}

export class DownloadBookUseCase {
	constructor(
		private readonly zlibrary: ZLibraryPort,
		private readonly bookRepository: BookRepositoryPort,
		private readonly uploadServiceFactory: () => UploadService,
		private readonly epubMetadataService = new EpubMetadataService()
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
		const downloadedBuffer = Buffer.from(fileData);
		let finalFileData: Uint8Array = downloadedBuffer;
		let rewrittenEpub = false;

		if (request.extension.toLowerCase() === 'epub') {
			const rewrittenEpubResult = await this.epubMetadataService.rewriteTitle(
				downloadedBuffer,
				request.title
			);

			if (rewrittenEpubResult.ok) {
				finalFileData = rewrittenEpubResult.value;
				rewrittenEpub = true;
			} else {
				console.warn(
					`[DownloadBookUseCase] EPUB title rewrite skipped for ${request.bookId}: ${rewrittenEpubResult.error.message}`
				);
			}
		}

		if (request.upload) {
			const key = `${request.title}_${request.bookId}.${request.extension}`;
			const uploadService = this.uploadServiceFactory();
			await uploadService.upload(key, finalFileData);

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
			fileData: toArrayBuffer(finalFileData),
			responseHeaders: buildDownloadHeaders(
				downloadResult.value.headers,
				finalFileData.byteLength,
				rewrittenEpub
			)
		});
	}
}
