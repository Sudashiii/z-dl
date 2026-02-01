import { downloadQueue } from '$lib/server/infrastructure/queue/downloadQueue';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

/**
 * Queue a book for download to library (async, returns immediately)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as ZDownloadBookRequest;
	const { bookId, hash, title, extension, author, cover, filesize, language, year } = body;

	if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 400 });
	}

	if (!bookId || !hash) {
		return json({ error: 'Missing bookId or hash parameter' }, { status: 400 });
	}

	try {
		// Queue the download task
		const taskId = downloadQueue.enqueue({
			bookId,
			hash,
			title,
			extension: extension ?? 'epub',
			author: author ?? null,
			cover: cover ?? null,
			filesize: filesize ?? null,
			language: language ?? null,
			year: year ?? null,
			userId: locals.zuser.userId,
			userKey: locals.zuser.userKey
		});

		const status = downloadQueue.getStatus();

		return json({
			success: true,
			taskId,
			message: 'Download queued successfully',
			queueStatus: status
		});
	} catch (err: unknown) {
		console.error(err);
		return json({ error: 'Failed to queue download' }, { status: 500 });
	}
};
