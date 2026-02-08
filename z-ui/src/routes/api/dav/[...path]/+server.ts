import type { RequestHandler } from '@sveltejs/kit';
import { listDavDirectoryUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';

// -------------------------------
// PROPFIND /api/dav/*path
// -------------------------------
export const fallback: RequestHandler = async ({ request, url }) => {
	if (request.method !== 'PROPFIND') {
		return errorResponse('Method not allowed', 405);
	}

	try {
		const rawPath = url.pathname.replace(/^\/api\/dav\/?/, '');
		const result = await listDavDirectoryUseCase.execute({ path: rawPath });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return new Response(result.value.xml, {
			status: 207, 
			headers: {
				'Content-Type': 'application/xml; charset=utf-8'
			}
		});
	} catch (err: any) {
		console.error('PROPFIND error:', err);
		return errorResponse('Failed to list directory', 500);
	}
};
