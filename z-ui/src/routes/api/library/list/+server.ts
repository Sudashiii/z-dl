import { listLibraryUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const result = await listLibraryUseCase.execute();
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Failed to fetch library books:', err);
		return errorResponse('Failed to fetch library books', 500);
	}
};
