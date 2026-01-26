import { type Result, ok, err } from '$lib/types/Result';
import type { ApiError } from '$lib/types/ApiError';
import { get } from '../base/get';
import { ZUIRoutes } from '../base/routes';

export async function authCheck(): Promise<Result<void, ApiError>> {
	const result = await get(ZUIRoutes.authCheck);

	if (!result.ok) {
		return err(result.error);
	}

	return ok(undefined);
}
