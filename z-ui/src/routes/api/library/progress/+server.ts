import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getProgressUseCase, putProgressUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';

export const GET: RequestHandler = async ({ url }) => {
	const fileName = url.searchParams.get('fileName');
	if (!fileName) {
		return errorResponse('Missing fileName parameter', 400);
	}

	try {
		const result = await getProgressUseCase.execute({ fileName });
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return new Response(result.value.data, {
			headers: {
				'Content-Type': 'application/x-lua',
				'Content-Disposition': `attachment; filename="${result.value.metadataFileName}"`
			}
		});
	} catch (err: unknown) {
		console.error('Progress fetch failed:', err);
		return errorResponse('Progress file not found', 404);
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const fileName = formData.get('fileName');
		const file = formData.get('file');
		const deviceId = formData.get('deviceId');

		if (typeof fileName !== 'string' || fileName.length === 0) {
			return errorResponse('Missing fileName in form data', 400);
		}
		if (!file || typeof (file as File).arrayBuffer !== 'function') {
			return errorResponse('Missing file in form data', 400);
		}

		const body = await (file as File).arrayBuffer();
		const result = await putProgressUseCase.execute({
			fileName,
			fileData: body,
			deviceId: typeof deviceId === 'string' && deviceId.trim() !== '' ? deviceId : undefined
		});

		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return json({
			success: true,
			progressKey: result.value.progressKey,
			incomingLatest: result.value.incomingLatest
		});
	} catch (err: unknown) {
		console.error('Progress upload failed:', err);
		return errorResponse('Progress upload failed', 500);
	}
};
