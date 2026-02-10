import { removeDeviceDownloadUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const bookId = Number(params.id);
	const deviceId = params.deviceId?.trim();

	if (!Number.isFinite(bookId)) {
		return errorResponse('Invalid book id', 400);
	}

	if (!deviceId) {
		return errorResponse('Missing device id', 400);
	}

	try {
		const result = await removeDeviceDownloadUseCase.execute({ bookId, deviceId });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return json(result.value);
	} catch (err: unknown) {
		console.error('Failed to remove device download:', err);
		return errorResponse('Failed to remove device download', 500);
	}
};
