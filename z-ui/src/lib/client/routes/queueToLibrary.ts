import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import type { ZBook } from '$lib/types/ZLibrary/ZBook';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import { post } from '../base/post';

export interface QueueResponse {
	taskId: string;
	message: string;
	queueStatus: {
		pending: number;
		processing: number;
	};
}

/**
 * Queues a book for async download to library.
 * Returns immediately without waiting for the download to complete.
 */
export async function queueToLibrary(book: ZBook): Promise<Result<QueueResponse, ApiError>> {
	const request: ZDownloadBookRequest = {
		bookId: String(book.id),
		hash: book.hash,
		title: book.title,
		upload: true,
		extension: book.extension,
		author: book.author,
		publisher: book.publisher,
		series: book.series,
		volume: book.volume,
		edition: book.edition,
		identifier: book.identifier,
		pages: book.pages,
		description: book.description,
		cover: book.cover,
		filesize: book.filesize,
		language: book.language,
		year: book.year,
		downloadToDevice: false
	};

	const result = await post('/zlibrary/queue', JSON.stringify(request));

	if (!result.ok) {
		return err(result.error);
	}

	try {
		const data = await result.value.json();
		return ok({
			taskId: data.taskId,
			message: data.message,
			queueStatus: data.queueStatus
		});
	} catch {
		return err(ApiErrors.network('Failed to parse queue response'));
	}
}
