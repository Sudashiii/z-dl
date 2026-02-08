import { refetchLibraryBookMetadataUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) {
		return errorResponse('Invalid book id', 400);
	}

	if (!locals.zuser) {
		return errorResponse('Z-Library login is not valid', 409);
	}

	try {
		const result = await refetchLibraryBookMetadataUseCase.execute({
			bookId: id,
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
		console.error('Failed to refetch library metadata:', err);
		return errorResponse('Failed to refetch library metadata', 500);
	}
};
