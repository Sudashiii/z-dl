import type { ZBook } from "$lib/types/ZLibrary/ZBook";

import { okGuard } from "../base/okGuard";
import { post } from "../base/post";

const ENDPOINT = '/zlibrary/download';


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
		okGuard(res);

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
