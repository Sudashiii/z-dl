import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import type { ZBook } from '$lib/types/ZLibrary/ZBook';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import { post } from '../base/post';
import { ZUIRoutes } from '../base/routes';

/**
 * Downloads a book file from the API and triggers a browser download.
 * Handles credentials automatically (via localStorage).
 */
export async function downloadBook(book: ZBook, options: { downloadToDevice?: boolean } = {}): Promise<Result<void, ApiError>> {
	const request: ZDownloadBookRequest = {
		bookId: String(book.id),
		hash: book.hash,
		title: book.title,
		upload: true,
		extension: book.extension,
		author: book.author,
		cover: book.cover,
		filesize: book.filesize,
		language: book.language,
		year: book.year,
		downloadToDevice: options.downloadToDevice
	};

	const result = await post(ZUIRoutes.downloadBook, JSON.stringify(request));

	if (!result.ok) {
		return err(result.error);
	}

	try {
		// If downloadToDevice is explicitly false, we don't expect a blob
		if (options.downloadToDevice === false) {
			return ok(undefined);
		}

		const blob = await result.value.blob();
		const url = window.URL.createObjectURL(blob);

		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${book.title}.${book.extension.toLowerCase()}`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();

		window.URL.revokeObjectURL(url);
		return ok(undefined);
	} catch {
		return err(ApiErrors.network('Failed to process download'));
	}
}
