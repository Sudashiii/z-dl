import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import type { Book } from '$lib/server/infrastructure/dbModels/models';
import { get } from '../base/get';
import { ZUIRoutes } from '../base/routes';

export interface LibraryResponse {
	success: boolean;
	books: Book[];
}

export async function getLibrary(): Promise<Result<LibraryResponse, ApiError>> {
	const result = await get(ZUIRoutes.library);

	if (!result.ok) {
		return err(result.error);
	}

	try {
		const data: LibraryResponse = await result.value.json();
		return ok(data);
	} catch {
		return err(ApiErrors.server('Failed to parse library response', 500));
	}
}
