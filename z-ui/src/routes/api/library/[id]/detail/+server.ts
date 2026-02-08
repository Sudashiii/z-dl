import { getLibraryBookDetailUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) {
		return errorResponse('Invalid book id', 400);
	}

	try {
		const result = await getLibraryBookDetailUseCase.execute({ bookId: id });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Failed to fetch library book detail:', err);
		return errorResponse('Failed to fetch library book detail', 500);
	}
};
