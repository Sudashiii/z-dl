import { updateLibraryBookMetadataUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import { getRequestLogger } from '$lib/server/http/requestLogger';
import { toLogError } from '$lib/server/infrastructure/logging/logger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const requestLogger = getRequestLogger(locals);
	const id = Number(params.id);
	if (!Number.isFinite(id)) {
		return errorResponse('Invalid book id', 400);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch (err: unknown) {
		requestLogger.warn(
			{ event: 'library.metadata.update.invalid_json', error: toLogError(err), bookId: id },
			'Invalid JSON body'
		);
		return errorResponse('Invalid JSON body', 400);
	}

	try {
		const result = await updateLibraryBookMetadataUseCase.execute({
			bookId: id,
			metadata: (body as Record<string, unknown>) as {
				title?: string;
				author?: string | null;
				publisher?: string | null;
				series?: string | null;
				volume?: string | null;
				edition?: string | null;
				identifier?: string | null;
				pages?: number | null;
				description?: string | null;
				cover?: string | null;
				language?: string | null;
				year?: number | null;
				externalRating?: number | null;
				externalRatingCount?: number | null;
				googleBooksId?: string | null;
				openLibraryKey?: string | null;
				amazonAsin?: string | null;
			}
		});
		if (!result.ok) {
			return errorResponse(result.error.message, result.error.status);
		}
		return json(result.value);
	} catch (err: unknown) {
		requestLogger.error(
			{ event: 'library.metadata.update.failed', error: toLogError(err), bookId: id },
			'Failed to update metadata'
		);
		return errorResponse('Failed to update metadata', 500);
	}
};
