import type { ZBook } from "$lib/types/ZLibrary/ZBook";
import { generateAuthHeader } from "./base/authHeader";
import { post } from "./base/post";

const ENDPOINT = '/api/zlibrary/download';

/**
 * Downloads a book file from the API and triggers a browser download.
 * Handles credentials automatically (via localStorage).
 */
export async function downloadBook(book: ZBook): Promise<void> {
	try {

        const body = JSON.stringify({
				bookId: book.id,
				hash: book.hash,
				title: book.title,
				upload: true,
				extension: book.extension
			});
        const res = await post(ENDPOINT, body);

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Download failed: ${res.status} ${res.statusText} - ${text}`);
		}

		const blob = await res.blob();
		const url = window.URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `${book.title}.${book.extension.toLowerCase()}`;
		document.body.appendChild(a);
		a.click();
		a.remove();

		window.URL.revokeObjectURL(url);
	} catch (err) {
		console.error('Download error:', err);
	}
}
