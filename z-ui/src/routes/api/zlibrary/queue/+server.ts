import { queueDownloadUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

/**
 * Queue a book for download to library (async, returns immediately)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as ZDownloadBookRequest;
	const { bookId, hash } = body;

	if (!locals.zuser) {
		return errorResponse('Z-Library login is not valid', 400);
	}

	if (!bookId || !hash) {
		return errorResponse('Missing bookId or hash parameter', 400);
	}

	try {
		const result = await queueDownloadUseCase.execute({
			request: body,
			credentials: {
				userId: locals.zuser.userId,
				userKey: locals.zuser.userKey
			}
		});
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return json(result.value);
	} catch (err: unknown) {
		console.error(err);
		return errorResponse('Failed to queue download', 500);
	}
};
