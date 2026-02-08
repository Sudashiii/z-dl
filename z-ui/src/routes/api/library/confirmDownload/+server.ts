import { confirmDownloadUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { deviceId, bookId } = body;

	// Validate input
	if (!deviceId || typeof bookId !== 'number') {
		return errorResponse('deviceId and bookId are required', 400);
	}

	try {
		const result = await confirmDownloadUseCase.execute({ deviceId, bookId });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value, { status: 201 });
	} catch (err: unknown) {
		console.error('Failed to confirm download:', err);
		return errorResponse('Failed to confirm download', 500);
	}
};
