import { getApiRouteCatalog } from '$lib/server/http/routeCatalog';
import { errorResponse } from '$lib/server/http/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		return json({
			success: true,
			routes: getApiRouteCatalog()
		});
	} catch (err: unknown) {
		console.error('Failed to generate API route catalog:', err);
		return errorResponse('Failed to generate API route catalog', 500);
	}
};
