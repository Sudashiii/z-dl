import { restoreLibraryBookUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const bookId = Number(params.id);
	if (!Number.isFinite(bookId)) {
		return errorResponse('Invalid book id', 400);
	}

	try {
		const result = await restoreLibraryBookUseCase.execute({ bookId });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Failed to restore book:', err);
		return errorResponse('Failed to restore book', 500);
	}
};
