import { getNewBooksForDeviceUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';


export const GET: RequestHandler = async ({ url }) => {
	const deviceId = url.searchParams.get('deviceId');

	if (!deviceId) {
		return errorResponse('Missing deviceId parameter', 400);
	}

	try {
		const result = await getNewBooksForDeviceUseCase.execute(deviceId);
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Failed to fetch new books for device:', err);
		return errorResponse('Failed to fetch new books', 500);
	}
};
