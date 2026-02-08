import { zlibrarySearchUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// -------------------------------
// POST /api/zlibrary/search
// -------------------------------
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as ZSearchBookRequest;
	if (!locals.zuser) {
		return errorResponse('Z-Library login is not valid', 409);
	}

	try {
		const searchResult = await zlibrarySearchUseCase.execute({
			request: body,
			credentials: {
				userId: locals.zuser.userId,
				userKey: locals.zuser.userKey
			}
		});
		if (!searchResult.ok) {
			return errorResponse(searchResult.error.message, searchResult.error.status);
		}

		return json(searchResult.value);
	} catch (err: unknown) {
		console.error(err);
		return errorResponse('Search failed', 500);
	}
};
