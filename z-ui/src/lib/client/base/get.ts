import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import { generateAuthHeader } from './authHeader';

export async function get(endpoint: string): Promise<Result<Response, ApiError>> {
	const authResult = generateAuthHeader();

	if (!authResult.ok) {
		return err(authResult.error);
	}

	try {
		const res = await fetch('/api' + endpoint, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: authResult.value
			}
		});

		if (!res.ok) {
			return err(await ApiErrors.fromResponse(res));
		}

		return ok(res);
	} catch (error) {
		return err(ApiErrors.network('Network request failed', error));
	}
}
