import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import {
	getLibraryFileUseCase,
	putLibraryFileUseCase,
	deleteLibraryFileUseCase
} from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';

export const GET: RequestHandler = async ({ params }) => {
	const title = params.title;
	if (!title) {
		return errorResponse('Missing title parameter', 400);
	}

	try {
		const result = await getLibraryFileUseCase.execute(title);
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}

		return new Response(result.value.data, {
			headers: {
				'Content-Type': result.value.contentType,
				'Content-Length': result.value.contentLength
			}
		});
	} catch (err: unknown) {
		console.error('Fetch library file failed:', err);
		return errorResponse('File not found', 404);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const title = params.title;
	if (!title) {
		return errorResponse('Missing title parameter', 400);
	}

	try {
		const body = await request.arrayBuffer();
		const result = await putLibraryFileUseCase.execute(title, body);
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Upload failed:', err);
		return errorResponse('Upload failed', 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const title = params.title;
	if (!title) {
		return errorResponse('Missing title parameter', 400);
	}

	try {
		const result = await deleteLibraryFileUseCase.execute(title);
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		console.error('Delete failed:', err);
		return errorResponse('Delete failed', 500);
	}
};
