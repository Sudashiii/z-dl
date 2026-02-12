import { getNewBooksForDeviceUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { getRequestLogger } from '$lib/server/http/requestLogger';
import { toLogError } from '$lib/server/infrastructure/logging/logger';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';


export const GET: RequestHandler = async ({ url, locals }) => {
	const requestLogger = getRequestLogger(locals);
	const deviceId = url.searchParams.get('deviceId');

	if (!deviceId) {
		requestLogger.warn({ event: 'library.new.validation_failed' }, 'Missing deviceId parameter');
		return errorResponse('Missing deviceId parameter', 400);
	}

	try {
		const result = await getNewBooksForDeviceUseCase.execute(deviceId);
		if (!result.ok) {
			requestLogger.warn(
				{
					event: 'library.new.use_case_failed',
					deviceId,
					statusCode: result.error.status,
					reason: result.error.message
				},
				'Fetch new books rejected'
			);
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		requestLogger.error(
			{ event: 'library.new.failed', error: toLogError(err), deviceId },
			'Failed to fetch new books for device'
		);
		return errorResponse('Failed to fetch new books', 500);
	}
};
