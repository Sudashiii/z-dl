import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { ZSearchBookResponse } from '$lib/types/ZLibrary/Responses/ZSearchBookResponse';
import { post } from '../base/post';
import { ZUIRoutes } from '../base/routes';

export async function searchBook(
	request: ZSearchBookRequest
): Promise<Result<ZSearchBookResponse, ApiError>> {
	const result = await post(ZUIRoutes.searchBook, JSON.stringify(request));

	if (!result.ok) {
		return err(result.error);
	}

	try {
		const data: ZSearchBookResponse = await result.value.json();
		return ok(data);
	} catch {
		return err(ApiErrors.server('Failed to parse search response', 500));
	}
}
