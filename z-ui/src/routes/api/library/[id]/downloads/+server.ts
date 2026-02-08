import { resetDownloadStatusUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    const { id } = params;

	if (!id) {
		return errorResponse('Missing book id', 400);
	}

	try {
		const result = await resetDownloadStatusUseCase.execute(Number(id));
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: any) {
		console.error('Failed to reset download status:', err);
		return errorResponse('Failed to reset download status', 500);
	}
};
